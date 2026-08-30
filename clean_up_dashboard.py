import sys
import os
import re

file_path = 'src/components/Dashboard.tsx'
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix nested buttons
# Look for <button ... <button ... onClick
# We want to remove the outer incomplete button tags
pattern = re.compile(r'<button\s+type="button"\s+<button', re.DOTALL)
content = content.replace('<button                                              type="button"                                              <button', '<button')
content = content.replace('<button                                            type="button"                                            <button', '<button')

# Clean up other potential merged lines
# This is a bit manual but based on what I saw in sed
content = content.replace('<button                                            type="button"                                            <button', '<button')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Cleaned up nested buttons in Dashboard.tsx')
