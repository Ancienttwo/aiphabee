#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const paths = {
  contract: "packages/data-contracts/src/business-output-evidence-composition.contract.json",
  fixtures: "packages/data-contracts/src/business-output-evidence-composition.fixtures.json",
  row1: "packages/data-contracts/src/error-taxonomy-reconciliation.contract.json"
};
const expectedFixtureIds = ["direct_fact_complete","derived_metric_complete","synthesis_contradictory_evidence","synthesis_material_unknown_partial","source_unavailable_mcp_generic","rights_unlicensed_denied","rights_scope_denied","missing_or_malformed_evidence_blocked","channel_identity_mutation_rejected"];
const expectedFailures = {missing_or_malformed_required_evidence:"DATA_QUALITY_HOLD",dangling_evidence_or_version_mismatch:"DATA_QUALITY_HOLD",rights_unlicensed:"DATA_NOT_LICENSED",rights_scope_or_channel_denied:"SCOPE_DENIED",owner_failure:"preserve_row1_identity",unknown_composition_defect:"INTERNAL_ERROR"};
const errors=[];
const contract=read(paths.contract), fixtures=read(paths.fixtures), row1=read(paths.row1);
if(process.argv.includes("--self-test")) selfTest(contract,fixtures,row1);
validate(contract,fixtures,row1);
finish();

function validate(c,fs,r){
  if(c.contract_version!=="2026-07-13.business-output-evidence-composition.v1") add("contract version mismatch");
  if(c.authority?.scope!=="cross_owner_composition_only"||c.authority?.runtime_payload_schema!==false||c.authority?.storage_model!==false||c.authority?.channel_semantics_owner!==false||c.authority?.owner_contracts_remain_authoritative!==true)add("authority boundary mismatch");
  if(c.frozen_dependencies?.error_taxonomy_contract!==r.contract_version||r.status!=="local_contract")add("Row 1 dependency is not frozen exactly");
  exact("fixture manifest",expectedFixtureIds,c.fixture_manifest); exact("fixture ids",expectedFixtureIds,fs.map(x=>x.id));
  exact("families",["direct_factual_observation","deterministic_derived_metric","multi_evidence_research_synthesis"],c.representative_output_families?.map(x=>x.id));
  exact("channels",["web","agent","fastclaw","mcp"],c.channel_projection_rules?.channels);
  if(c.channel_projection_rules?.identity_mutation!==false||c.channel_projection_rules?.claim_meaning_mutation!==false||c.channel_projection_rules?.denial_state_mutation!==false||c.channel_projection_rules?.fastclaw_final_semantics_owner!==false)add("channel projection authority mismatch");
  if(c.outcome_rules?.duplicated_evidence_payload_forbidden!==true||c.outcome_rules?.confidence_percentages_forbidden!==true)add("forbidden output rules weakened");
  exact("evidence strengths",["strong","medium","weak","unknown"],c.outcome_rules?.evidence_strength_values);
  const failure=Object.fromEntries(c.failure_map.map(x=>[x.condition,x.public_error])); for(const [k,v] of Object.entries(expectedFailures))if(failure[k]!==v)add(`failure map mismatch: ${k}`);
  const row1ByCode=new Map(r.entries.map(x=>[x.code,x])); for(const code of ["DATA_QUALITY_HOLD","DATA_NOT_LICENSED","SCOPE_DENIED","INTERNAL_ERROR"])if(!row1ByCode.has(code))add(`failure code absent from Row 1: ${code}`);
  validateAuthorities(c.source_authorities);
  for(const f of fs) validateFixture(f,row1ByCode);
  exact("forbidden constructs",["business_output_runtime_dto","card_catalogue","duplicate_evidence_record","alternate_citation_format","local_evidence_reconstruction","confidence_percentage","channel_specific_claim_semantics","rights_inference_or_activation"],c.forbidden_constructs);
}

function validateFixture(f,row1ByCode){
  exactKeys(`${f.id}.root`,f,["id","family","channel","non_authoritative_test_fixture","canonical_input","projection","expected"]);
  if(f.non_authoritative_test_fixture!==true)add(`${f.id}: fixture authority flag missing`);
  if(!["web","agent","fastclaw","mcp"].includes(f.channel))add(`${f.id}: invalid channel`);
  rejectUnknownConfidence(f,f.id);
  exactKeys(`${f.id}.canonical_input`,f.canonical_input,["envelope","evidence_record","claim","calculation","rights_reference","owner_failure"],true);
  const ci=f.canonical_input, expected=f.expected;
  exactKeys(`${f.id}.claim`,ci.claim,["calculationId","claimId","dataVersion","evidenceCardId","label","methodologyVersion","sourceRecordId","text"],true);
  if(ci.claim.claimId===undefined||ci.claim.text===undefined)add(`${f.id}: canonical claim required fields missing`);
  exactKeys(`${f.id}.expected`,expected,["outcome","public_error","emit_projection","retain_internal_error_identity"],true);
  if(expected.emit_projection===true && !f.projection)add(`${f.id}: projection required`);
  if(expected.outcome==="blocked" && f.projection!==null)add(`${f.id}: blocked fixture must not emit projection`);
  if(f.projection){
    exactKeys(`${f.id}.projection`,f.projection,["envelope_identity","evidence_record_ids","evidence_source_ref_ids","source_record_ids","claim_id","calculation_id","denial_state","rights_policy_version","evidence_payload_embedded","limitations","evidence_strength","material_unknowns"],true);
    if(f.projection.evidence_payload_embedded!==false)add(`${f.id}: duplicated evidence payload`);
    const env=ci.envelope, ev=ci.evidence_record, p=f.projection;
    exactKeys(`${f.id}.envelope`,env,["request_id","as_of","data_version","methodology_version","provenance"]);
    exactKeys(`${f.id}.envelope_identity`,p.envelope_identity,["request_id","as_of","data_version","methodology_version"]);
    for(const k of ["request_id","as_of","data_version","methodology_version"])if(p.envelope_identity[k]!==env[k])add(`${f.id}: envelope identity mismatch ${k}`);
    if(ev.asOf!==env.as_of||ev.dataVersion!==env.data_version||ev.methodologyVersion!==env.methodology_version)add(`${f.id}: evidence/envelope version mismatch`);
    if(ev.evidenceRecord.requestId!==env.request_id||ev.evidenceRecord.dataVersion!==env.data_version||ev.evidenceRecord.methodologyVersion!==env.methodology_version)add(`${f.id}: evidence record identity mismatch`);
    const recordIds=[ev.evidenceRecord.evidenceRecordId], refIds=ev.sourceRefs.map(x=>x.evidenceSourceRefId), sourceIds=ev.sourceRefs.map(x=>x.sourceRecordId);
    exact(`${f.id}.evidence record refs`,recordIds,p.evidence_record_ids); exact(`${f.id}.source refs`,refIds,p.evidence_source_ref_ids); exact(`${f.id}.source records`,sourceIds,p.source_record_ids);
    for(const ref of ev.sourceRefs){if(ref.evidenceRecordId!==recordIds[0]||ref.dataVersion!==env.data_version||ref.methodologyVersion!==env.methodology_version)add(`${f.id}: dangling or version-mismatched source ref`)}
    const provenanceIds=env.provenance.map(x=>x.source_record_id);
    for(const ref of ev.sourceRefs){const match=env.provenance.find(x=>x.source_record_id===ref.sourceRecordId);if(!match||match.source!==ref.source||match.data_version!==ref.dataVersion||match.methodology_version!==ref.methodologyVersion)add(`${f.id}: provenance/source-ref identity mismatch`)}
    if(env.provenance.length===1&&provenanceIds[0]!==sourceIds[0])add(`${f.id}: provenance identity mismatch`);
    if(p.claim_id!==ci.claim.claimId && expected.outcome!=="rejected")add(`${f.id}: claim identity mutation`);
    if(ci.claim.evidenceCardId && !recordIds.includes(ci.claim.evidenceCardId))add(`${f.id}: dangling claim evidence card`);
    if(ci.claim.sourceRecordId && !sourceIds.includes(ci.claim.sourceRecordId))add(`${f.id}: dangling claim source record`);
    if(ci.claim.dataVersion!==env.data_version||ci.claim.methodologyVersion!==env.methodology_version)add(`${f.id}: claim version mismatch`);
    if(ci.calculation){if(p.calculation_id!==ci.calculation.calculation_id||ci.calculation.methodology_version!==env.methodology_version)add(`${f.id}: calculation identity/version mismatch`);exact(`${f.id}.calculation sources`,ci.calculation.source_record_ids,p.source_record_ids)}
    else if(p.calculation_id!==null)add(`${f.id}: unexpected calculation identity`);
    if(ci.rights_reference){if(p.denial_state!==ci.rights_reference.denial_state||p.rights_policy_version!==ci.rights_reference.rights_policy_version)add(`${f.id}: rights identity mutation`)}
    if(p.evidence_strength!==undefined&&!["strong","medium","weak","unknown"].includes(p.evidence_strength))add(`${f.id}: invalid evidence strength`);
  }
  if(expected.outcome==="rejected"&&f.projection?.claim_id===ci.claim.claimId)add(`${f.id}: rejected fixture must demonstrate identity mutation`);
  if(ci.owner_failure){
    const row1=row1ByCode.get(ci.owner_failure.internal_code); if(!row1)add(`${f.id}: owner failure absent from Row 1`); else {
      const mapping=row1.channel_mapping?.[f.channel]; if(mapping!==ci.owner_failure.row1_mcp_mapping)add(`${f.id}: Row 1 channel mapping mismatch`);
      if(mapping===null && expected.public_error!=="INTERNAL_ERROR")add(`${f.id}: non-public owner failure must use Row 1 unknown policy`);
    }
  }
  if(ci.rights_reference?.denial_state==="unlicensed"&&(expected.public_error!=="DATA_NOT_LICENSED"||expected.emit_projection!==false))add(`${f.id}: unlicensed denial weakened`);
  if(ci.rights_reference?.denial_state==="scope_denied"&&(expected.public_error!=="SCOPE_DENIED"||expected.emit_projection!==false))add(`${f.id}: scope denial weakened`);
  if(f.id==="missing_or_malformed_evidence_blocked"&&(expected.public_error!=="DATA_QUALITY_HOLD"||expected.emit_projection!==false))add("malformed evidence must fail closed");
  if(f.id==="synthesis_contradictory_evidence"&&(!f.projection?.limitations?.length||f.projection.evidence_source_ref_ids.length<2))add("contradictory evidence not preserved");
  if(f.id==="synthesis_material_unknown_partial"&&!f.projection?.material_unknowns?.every(x=>x.missing_reason))add("material unknown missing reason");
}

function validateAuthorities(authorities){
  const expected={
    response_envelope:{owner:"@aiphabee/data-contracts",path:"packages/data-contracts/src/index.ts",selectors:{ProvenanceRef:["source","source_record_id","data_version","methodology_version"],SuccessEnvelope:["data","ok"],ErrorEnvelope:["error","ok"]}},
    evidence_lineage:{owner:"@aiphabee/evidence-lineage",path:"packages/evidence-lineage/src/index.ts",selectors:{EvidenceSourceRefPlan:["dataVersion","evidenceRecordId","evidenceSourceRefId","methodologyVersion","source","sourceRecordId"],EvidenceRecordPlan:["asOf","citation","dataVersion","evidenceRecord","liveDbWrites","methodologyVersion","provenance","sourceRefs","sqlEmitted","status","tables","usage","version"]}},
    agent_claim_binding:{owner:"@aiphabee/agent-runtime",path:"packages/agent-runtime/src/index.ts",selectors:{AgentAnswerDraftClaimInput:["calculationId","claimId","dataVersion","evidenceCardId","label","methodologyVersion","sourceRecordId","text"],AgentAnswerEvidenceCardInput:["cardId","dataVersion","methodologyVersion","sourceRecordId"],AgentAnswerCalculationRefInput:["calculationId","methodologyVersion","sourceRecordIds"]}}
  };
  for(const [id,e] of Object.entries(expected)){const a=authorities.find(x=>x.id===id);if(!a||a.owner!==e.owner||a.path!==e.path)add(`${id}: authority metadata mismatch`);else{exact(`${id}.selectors`,Object.keys(e.selectors),a.selectors);const declarations=interfaceFields(e.path);for(const [name,fields] of Object.entries(e.selectors)){if(!declarations.has(name))add(`${id}: exact declaration missing ${name}`);else {const actual=declarations.get(name);if(fields)exact(`${id}.${name}.fields`,fields,actual);else if(actual.length===0)add(`${id}: empty owner interface ${name}`)}}}}
  const jsonAuth=authorities.find(x=>x.id==="answer_evidence_declaration"); const json=read("deploy/agent/answer-evidence-contract.contract.json"); if(!jsonAuth||jsonAuth.path!=="deploy/agent/answer-evidence-contract.contract.json")add("answer evidence JSON authority metadata mismatch");else {exact("answer evidence selectors",["required_claim_labels","evidence_card_required_fields"],jsonAuth.selectors);if(json.version!=="2026-06-21.phase1.answer-evidence-contract-scaffold.v0")add("answer evidence JSON version mismatch");for(const selector of jsonAuth.selectors)if(!(selector in json))add(`answer evidence JSON selector missing ${selector}`)}
}

function interfaceFields(path){const sf=ts.createSourceFile(path,readFileSync(resolve(root,path),"utf8"),ts.ScriptTarget.Latest,true),m=new Map;for(const s of sf.statements)if(ts.isInterfaceDeclaration(s)&&s.modifiers?.some(x=>x.kind===ts.SyntaxKind.ExportKeyword))m.set(s.name.text,s.members.map(x=>x.name?.getText(sf).replaceAll('"',"")).filter(Boolean));return m}
function selfTest(c,fs,r){const cases=[
 ["runtime schema",v=>v.authority.runtime_payload_schema=true,"authority boundary"],
 ["dangling",(v,x)=>x[0].projection.evidence_source_ref_ids=["missing_ref"],"source refs"],
 ["data version",(v,x)=>x[0].projection.envelope_identity.data_version="dv2","envelope identity mismatch"],
 ["method version",(v,x)=>x[1].canonical_input.calculation.methodology_version="wrong","calculation identity/version"],
 ["source identity",(v,x)=>x[0].projection.source_record_ids=["other"],"source records"],
 ["claim identity",(v,x)=>x[0].projection.claim_id="other","claim identity mutation"],
 ["rights version",(v,x)=>{x[5].projection={...clone(x[0].projection),denial_state:"unlicensed",rights_policy_version:"wrong"};x[5].expected.emit_projection=true},"rights identity mutation"],
 ["denial",(v,x)=>x[5].expected.public_error="INTERNAL_ERROR","unlicensed denial weakened"],
 ["confidence alias",(v,x)=>x[0].projection.confidence=0.9,"confidence"],
 ["duplicate payload",(v,x)=>x[0].projection.evidence_payload={raw:true},"evidence_payload"],
 ["row1 mapping",(v,x)=>x[4].expected.public_error="POINT_IN_TIME_UNAVAILABLE","unknown policy"],
 ["ledger selectors emptied",v=>v.source_authorities.forEach(a=>{a.selectors=[]}),"selectors"],
 ["dangling claim evidence",(v,x)=>x[0].canonical_input.claim.evidenceCardId="missing_ev","dangling claim evidence card"],
 ["provenance identity",(v,x)=>x[0].canonical_input.envelope.provenance[0].source_record_id="other_source","provenance"],
 ["invalid strength",(v,x)=>x[2].projection.evidence_strength="99_percent","invalid evidence strength"]];
 for(const [name,mutate,expected] of cases){const vc=clone(c),vf=clone(fs);mutate(vc,vf);errors.length=0;validate(vc,vf,r);if(!errors.some(x=>x.includes(expected))){console.error(`self-test ${name} failed: expected ${expected}`);process.exit(1)}}errors.length=0}
function rejectUnknownConfidence(v,path){if(!v||typeof v!=="object")return;for(const [k,x] of Object.entries(v)){if(/confidence|evidence_payload/i.test(k)&&k!=="evidence_payload_embedded")add(`${path}: forbidden field ${k}`);rejectUnknownConfidence(x,`${path}.${k}`)}}
function exactKeys(label,obj,allowed,optional=false){if(!obj||typeof obj!=="object"||Array.isArray(obj)){add(`${label}: object required`);return}const keys=Object.keys(obj);for(const k of keys)if(!allowed.includes(k))add(`${label}: unknown field ${k}`);if(!optional)for(const k of allowed)if(!(k in obj))add(`${label}: missing field ${k}`)}
function exact(label,a,b){if(!Array.isArray(b)){add(`${label}: not array`);return}const x=[...new Set(a)].sort(),y=[...new Set(b)].sort();if(b.length!==y.length)add(`${label}: duplicates`);if(JSON.stringify(x)!==JSON.stringify(y))add(`${label}: exact set mismatch`)}
function read(p){return JSON.parse(readFileSync(resolve(root,p),"utf8"))}function clone(v){return JSON.parse(JSON.stringify(v))}function add(v){errors.push(v)}function finish(){if(errors.length){console.error(JSON.stringify({status:"invalid_contract",errors:[...new Set(errors)].sort()},null,2));process.exit(1)}console.log(JSON.stringify({status:"ok",contract_version:contract.contract_version,families:contract.representative_output_families.length,fixtures:fixtures.length},null,2))}
