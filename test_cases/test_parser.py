from modules.parser import extract_text
import os

folder_path = "data/resumes"

for file in os.listdir(folder_path):
    file_path = os.path.join(folder_path, file)
    
    print(f"\nProcessing: {file}")
    
    text = extract_text(file_path)
    
    print("Preview:", text[:500])