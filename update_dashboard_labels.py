import sys
import os

file_path = 'src/components/Dashboard.tsx'
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Labels
# 5. إحالة الطلب للمدرسة (البحث والفلترة): -> 5. إحالة الطلب للمدرسة للتسكين:
content = content.replace('<span>{isRtl ? "5. إحالة الطلب للمدرسة (البحث والفلترة):" : "5. Refer to School:"}</span>', 
                          '<span>{isRtl ? "5. إحالة الطلب للمدرسة للتسكين:" : "5. Refer to School for Staffing:"}</span>')

# 🏫 5. إحالة الطلب للمدرسة بعد التسكين -> 🏫 إحالة الطلب للمدرسة للتسكين
content = content.replace('<span>{isRtl ? "🏫 5. إحالة الطلب للمدرسة بعد التسكين" : "5. Route to School with Doc"}</span>',
                          '<span>{isRtl ? "🏫 إحالة الطلب للمدرسة للتسكين" : "Route to School for Staffing"}</span>')

# 🏫 إحالة الطلب للمدرسة بعد التسكين مرفق به المعادلة -> 🏫 إحالة الطلب للمدرسة للتسكين
content = content.replace('<span>🏫 {isRtl ? \'إحالة الطلب للمدرسة بعد التسكين مرفق به المعادلة\' : \'Refer Request to School with Equivalency\'}</span>',
                          '<span>🏫 {isRtl ? \'إحالة الطلب للمدرسة للتسكين\' : \'Refer Request to School for Staffing\'}</span>')

# 2. Update conditions for independence
# We want to replace the specific 'approved' check for blocks 5 and 6
import re

# Block 5 and 6 conditions
# Replace survey.vacancyRequestStatus === 'approved' && ( with a more inclusive one
# We look for the one that is likely block 5 or 6 based on context (near the labels)

# Pattern for block 5 start in equivalency section
p5 = r'\{\/\* 5\. أيقونة إحالة الطلب للمدرسة بعد التسكين مرفق به المعادلة \*\/\}\s*\{survey\.vacancyRequestStatus === \'approved\' && \('
r5 = r'{/* 5. أيقونة إحالة الطلب للمدرسة للتسكين مرفق به المعادلة */}\n                                      {(survey.vacancyRequestStatus === \'approved\' || survey.vacancyRequestStatus === \'sent_to_school_principal\' || survey.vacancyRequestStatus === \'sent_to_leadership\') && ('
content = re.sub(p5, r5, content)

# Pattern for block 6 start in equivalency section
p6 = r'\{\/\* 6\. أيقونة إرسال الطلب لمشرف القيادة لمتابعة التسكين وفق المرحلة والجنس تلقائياً \*\/\}\s*\{survey\.vacancyRequestStatus === \'approved\' && \(\(\) => \{'
r6 = r'{/* 6. أيقونة إرسال الطلب لمشرف القيادة لمتابعة التسكين وفق المرحلة والجنس تلقائياً */}\n                                      {(survey.vacancyRequestStatus === \'approved\' || survey.vacancyRequestStatus === \'sent_to_school_principal\' || survey.vacancyRequestStatus === \'sent_to_leadership\') && (() => {'
content = re.sub(p6, r6, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Successfully updated Dashboard.tsx labels and logic')
