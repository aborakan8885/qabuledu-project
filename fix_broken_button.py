import sys
import os

file_path = 'src/components/Dashboard.tsx'
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken button structure
# We search for the pattern that was corrupted
# It seems some lines were merged or tag names deleted

bad_pattern = """                                              <button                                                type="button"                                                onClick={() => {                                                  const targetSch = eqTargetSchoolMap[survey.id] || survey.firstSchoolName || survey.schoolName;                                                  const calibratedGrade = survey.grade || "الأول الابتدائي";                                                  const docName = eqDocNameMap[survey.id] || survey.transferAttachmentName || "وثيقة المعادلة.pdf";                                                  const docData = eqDocDataMap[survey.id] || survey.transferAttachmentData || "";                                                                                                    if (onUpdateSurvey) {                                                onUpdateSurvey({                                                  ...survey,                                                  schoolName: targetSch,                                                  grade: calibratedGrade,                                                  staffingConfirmedSchoolName: targetSch,                                                  staffingConfirmedGrade: calibratedGrade,                                                  staffingConfirmedStage: survey.stage,                                                  sentToSchoolPrincipal: true,                                                  sentToPrincipalAt: new Date().toISOString(),                                                  vacancyRequestStatus: "sent_to_school_principal",                                                  equalizationDocAttached: true,                                                  equalizationDocName: docName,                                                  transferAttachmentData: docData,                                                  referringOfficerId: activeOfficer.id,                                                  referringOfficerName: activeOfficer.nameAr,                                                  notes: isRtl                                                    ? "🏫 تم إحالة الطلب لمدير مدرسة (" + targetSch + ") للتسكين المباشر مرفق به وثيقة المعادلة المعتمدة (" + docName + ")."                                                    : "Referred to school (" + targetSch + ") with attached equivalency doc."                                                } as any);                                              }                                            }}                                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"                                          >"""

# Since exact match might fail due to whitespace or merged lines, I'll use a more flexible replacement
import re

# Look for the className and contents of the button
# We want to restore the <button type="button" onClick={() => { ... }}> part

# The pattern we saw in sed:
# refers to school name, grade, docName etc.

button_fix = """                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const targetSch = eqTargetSchoolMap[survey.id] || survey.firstSchoolName || survey.schoolName;
                                                  const calibratedGrade = survey.grade || "الأول الابتدائي";
                                                  const docName = eqDocNameMap[survey.id] || survey.transferAttachmentName || "وثيقة المعادلة.pdf";
                                                  const docData = eqDocDataMap[survey.id] || survey.transferAttachmentData || "";
                                                  
                                                  if (onUpdateSurvey) {
                                                    onUpdateSurvey({
                                                      ...survey,
                                                      schoolName: targetSch,
                                                      grade: calibratedGrade,
                                                      staffingConfirmedSchoolName: targetSch,
                                                      staffingConfirmedGrade: calibratedGrade,
                                                      staffingConfirmedStage: survey.stage,
                                                      sentToSchoolPrincipal: true,
                                                      sentToPrincipalAt: new Date().toISOString(),
                                                      vacancyRequestStatus: "sent_to_school_principal",
                                                      equalizationDocAttached: true,
                                                      equalizationDocName: docName,
                                                      transferAttachmentData: docData,
                                                      referringOfficerId: activeOfficer.id,
                                                      referringOfficerName: activeOfficer.nameAr,
                                                      notes: isRtl
                                                        ? "🏫 تم إحالة الطلب لمدير مدرسة (" + targetSch + ") للتسكين المباشر مرفق به وثيقة المعادلة المعتمدة (" + docName + ")."
                                                        : "Referred to school (" + targetSch + ") with attached equivalency doc."
                                                    } as any);
                                                  }
                                                }}
                                                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                                              >"""

# Use regex to find the corrupted block and replace it
# We match from docData until the end of className
pattern = re.compile(r'const docData = eqDocDataMap\[survey\.id\] \|\| survey\.transferAttachmentData \|\| "";.*?active:scale-95"', re.DOTALL)

if pattern.search(content):
    # This is a bit risky, let's try to be more specific or use the sed output info
    content = re.sub(r'<button\s+type="button"\s+onClick=\{\(\) => \{.*?active:scale-95"', button_fix.strip(), content, flags=re.DOTALL)
    # The above regex assumes it starts with <button ... but if that was deleted, it might fail.
    
    # If the <button tag was deleted:
    if "className=\"w-full py-1.5 px-2 bg-emerald-600" in content and "onClick" in content:
         # Try replacing the block specifically
         pass

# Safer way: replace from the start of the section
section_start = 'const targetSch = eqTargetSchoolMap[survey.id] || survey.firstSchoolName || survey.schoolName;'
if section_start in content:
    # Find the end of the button
    end_of_button = '</span>                                          </button>'
    # We want to replace everything from targetSch (plus some lines before) to </button>
    
    # Actually, I'll just replace the whole corrupted block I saw in sed
    content = content.replace(bad_pattern, button_fix)
    
    # If bad_pattern didn't match exactly, let's try a regex for the corrupted area
    if button_fix not in content:
        content = re.sub(r'onClick=\{\(\) => \{.*?active:scale-95"\s*>', button_fix.strip(), content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully fixed broken button in Dashboard.tsx')
