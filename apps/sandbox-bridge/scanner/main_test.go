package main

import (
	"testing"
	"time"
)

func TestParseVersion(t *testing.T) {
	engine, signatures, err := parseVersion("ClamAV 1.5.3/27888/Fri Jul 11 08:00:00 2026\n")
	if err != nil {
		t.Fatal(err)
	}
	if engine != "ClamAV 1.5.3" {
		t.Fatalf("unexpected engine %q", engine)
	}
	if signatures != "27888/Fri Jul 11 08:00:00 2026" {
		t.Fatalf("unexpected signatures %q", signatures)
	}
}

func TestSignatureCurrent(t *testing.T) {
	now := time.Date(2026, time.July, 11, 8, 0, 0, 0, time.UTC)
	if !signatureCurrent("28057/Sat Jul 11 06:00:00 2026", now) {
		t.Fatal("expected a two-hour-old signature database to be current")
	}
	if signatureCurrent("28051/Sun Jul  5 06:24:23 2026", now) {
		t.Fatal("expected an older-than-72h signature database to fail closed")
	}
}

func TestInterpretScanResult(t *testing.T) {
	tests := []struct {
		input   string
		status  string
		reason  string
		wantErr bool
	}{
		{input: "stream: OK", status: "clean"},
		{input: "stream: Eicar-Signature FOUND", status: "unsafe", reason: "malware_detected"},
		{input: "stream: size limit exceeded. ERROR", wantErr: true},
	}
	for _, test := range tests {
		status, reason, err := interpretScanResult(test.input)
		if test.wantErr {
			if err == nil {
				t.Fatalf("expected error for %q", test.input)
			}
			continue
		}
		if err != nil {
			t.Fatalf("unexpected error for %q: %v", test.input, err)
		}
		if status != test.status || reason != test.reason {
			t.Fatalf("unexpected result for %q: %q %q", test.input, status, reason)
		}
	}
}
