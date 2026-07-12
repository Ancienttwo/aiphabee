package main

import (
	"bufio"
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	defaultClamdAddress  = "127.0.0.1:3310"
	defaultListenAddress = ":8080"
	maxScanBytes         = 10 * 1024 * 1024
	clamdTimeout         = 60 * time.Second
	maxSignatureAge      = 72 * time.Hour
)

type scanResponse struct {
	Engine           string `json:"engine"`
	ReasonCode       string `json:"reason_code,omitempty"`
	ScannedAt        string `json:"scanned_at"`
	SignatureVersion string `json:"signature_version"`
	Status           string `json:"status"`
}

type scannerServer struct {
	clamdAddress string
	now          func() time.Time
	slots        chan struct{}
}

func main() {
	clamdAddress := os.Getenv("CLAMD_ADDRESS")
	if clamdAddress == "" {
		clamdAddress = defaultClamdAddress
	}
	listenAddress := os.Getenv("LISTEN_ADDRESS")
	if listenAddress == "" {
		listenAddress = defaultListenAddress
	}

	server := &scannerServer{
		clamdAddress: clamdAddress,
		now:          time.Now,
		slots:        make(chan struct{}, 4),
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /startup", server.startup)
	mux.HandleFunc("GET /health", server.health)
	mux.HandleFunc("POST /scan", server.scan)

	log.Printf("artifact scanner listening on %s", listenAddress)
	httpServer := &http.Server{
		Addr:              listenAddress,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       70 * time.Second,
		WriteTimeout:      70 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	log.Fatal(httpServer.ListenAndServe())
}

func (server *scannerServer) startup(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, scanResponse{
		ScannedAt: server.now().UTC().Format(time.RFC3339Nano),
		Status:    "clean",
	})
}

func (server *scannerServer) health(writer http.ResponseWriter, request *http.Request) {
	engine, signatures, err := server.version(request.Context())
	if err != nil {
		writeJSON(writer, http.StatusServiceUnavailable, scanResponse{
			ReasonCode: "scanner_not_ready",
			ScannedAt:  server.now().UTC().Format(time.RFC3339Nano),
			Status:     "error",
		})
		return
	}
	writeJSON(writer, http.StatusOK, scanResponse{
		Engine:           engine,
		ScannedAt:        server.now().UTC().Format(time.RFC3339Nano),
		SignatureVersion: signatures,
		Status:           "clean",
	})
}

func (server *scannerServer) scan(writer http.ResponseWriter, request *http.Request) {
	if request.Header.Get("content-type") != "application/octet-stream" {
		writeJSON(writer, http.StatusUnsupportedMediaType, scanResponse{
			ReasonCode: "invalid_content_type",
			ScannedAt:  server.now().UTC().Format(time.RFC3339Nano),
			Status:     "error",
		})
		return
	}

	select {
	case server.slots <- struct{}{}:
		defer func() { <-server.slots }()
	case <-request.Context().Done():
		return
	}

	engine, signatures, err := server.version(request.Context())
	if err != nil {
		writeJSON(writer, http.StatusServiceUnavailable, scanResponse{
			ReasonCode: "scanner_not_ready",
			ScannedAt:  server.now().UTC().Format(time.RFC3339Nano),
			Status:     "error",
		})
		return
	}

	request.Body = http.MaxBytesReader(writer, request.Body, maxScanBytes)
	result, err := server.scanStream(request.Context(), request.Body)
	if err != nil {
		status := http.StatusBadGateway
		reason := "scanner_protocol_error"
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			status = http.StatusRequestEntityTooLarge
			reason = "payload_too_large"
		}
		writeJSON(writer, status, scanResponse{
			Engine:           engine,
			ReasonCode:       reason,
			ScannedAt:        server.now().UTC().Format(time.RFC3339Nano),
			SignatureVersion: signatures,
			Status:           "error",
		})
		return
	}

	status, reason, err := interpretScanResult(result)
	if err != nil {
		writeJSON(writer, http.StatusBadGateway, scanResponse{
			Engine:           engine,
			ReasonCode:       "scanner_protocol_error",
			ScannedAt:        server.now().UTC().Format(time.RFC3339Nano),
			SignatureVersion: signatures,
			Status:           "error",
		})
		return
	}
	writeJSON(writer, http.StatusOK, scanResponse{
		Engine:           engine,
		ReasonCode:       reason,
		ScannedAt:        server.now().UTC().Format(time.RFC3339Nano),
		SignatureVersion: signatures,
		Status:           status,
	})
}

func (server *scannerServer) version(ctx context.Context) (string, string, error) {
	response, err := server.command(ctx, "zVERSION\x00")
	if err != nil {
		return "", "", err
	}
	engine, signatures, err := parseVersion(response)
	if err != nil {
		return "", "", err
	}
	if !signatureCurrent(signatures, server.now()) {
		return "", "", fmt.Errorf("clamd signature database is stale")
	}
	return engine, signatures, nil
}

func (server *scannerServer) command(ctx context.Context, command string) (string, error) {
	connection, err := server.dial(ctx)
	if err != nil {
		return "", err
	}
	defer connection.Close()
	if _, err := io.WriteString(connection, command); err != nil {
		return "", err
	}
	return readNullTerminated(connection)
}

func (server *scannerServer) scanStream(ctx context.Context, source io.Reader) (string, error) {
	connection, err := server.dial(ctx)
	if err != nil {
		return "", err
	}
	defer connection.Close()
	if _, err := io.WriteString(connection, "zINSTREAM\x00"); err != nil {
		return "", err
	}

	buffer := make([]byte, 64*1024)
	length := make([]byte, 4)
	for {
		read, readErr := source.Read(buffer)
		if read > 0 {
			binary.BigEndian.PutUint32(length, uint32(read))
			if _, err := connection.Write(length); err != nil {
				return "", err
			}
			if _, err := connection.Write(buffer[:read]); err != nil {
				return "", err
			}
		}
		if readErr != nil {
			if errors.Is(readErr, io.EOF) {
				break
			}
			return "", readErr
		}
	}
	if _, err := connection.Write([]byte{0, 0, 0, 0}); err != nil {
		return "", err
	}
	return readNullTerminated(connection)
}

func (server *scannerServer) dial(ctx context.Context) (net.Conn, error) {
	dialer := net.Dialer{Timeout: 5 * time.Second}
	connection, err := dialer.DialContext(ctx, "tcp", server.clamdAddress)
	if err != nil {
		return nil, err
	}
	if err := connection.SetDeadline(time.Now().Add(clamdTimeout)); err != nil {
		connection.Close()
		return nil, err
	}
	return connection, nil
}

func readNullTerminated(reader io.Reader) (string, error) {
	response, err := bufio.NewReader(reader).ReadString(0)
	if err != nil {
		return "", err
	}
	return strings.TrimSuffix(response, "\x00"), nil
}

func parseVersion(response string) (string, string, error) {
	parts := strings.SplitN(strings.TrimSpace(response), "/", 2)
	if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
		return "", "", fmt.Errorf("invalid clamd version response")
	}
	return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]), nil
}

func signatureCurrent(signatures string, now time.Time) bool {
	parts := strings.Split(signatures, "/")
	if len(parts) < 2 {
		return false
	}
	builtAt, err := time.Parse("Mon Jan _2 15:04:05 2006", parts[len(parts)-1])
	if err != nil {
		return false
	}
	age := now.UTC().Sub(builtAt.UTC())
	return age >= -24*time.Hour && age <= maxSignatureAge
}

func interpretScanResult(response string) (string, string, error) {
	trimmed := strings.TrimSpace(response)
	if trimmed == "stream: OK" {
		return "clean", "", nil
	}
	if strings.HasPrefix(trimmed, "stream: ") && strings.HasSuffix(trimmed, " FOUND") {
		return "unsafe", "malware_detected", nil
	}
	return "", "", fmt.Errorf("unexpected clamd scan response")
}

func writeJSON(writer http.ResponseWriter, status int, payload scanResponse) {
	writer.Header().Set("cache-control", "no-store")
	writer.Header().Set("content-type", "application/json; charset=utf-8")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(payload); err != nil {
		log.Printf("scanner response encode failed: %v", err)
	}
}
