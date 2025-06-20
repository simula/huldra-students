import pandas as pd

# Load the Excel file
df = pd.read_excel("../Dataset/AuditoryTestResults.xlsx")  # Adjust path as needed

# Define correct answers for each case
correct_answers = {
    'Case1': 'A',
    'Case2': 'B',
    'Case3': 'A',
    'Case4': 'B',
    'Case5': 'B',
    'Case6': 'A',
    'Case7': 'A'
}

# Optional labels for each case
labels = {
    'Case1': 'Normal',
    'Case2': 'Normal',
    'Case3': 'Distorted',
    'Case4': 'Distorted',
    'Case5': 'Noisy',
    'Case6': 'Noisy',
    'Case7': 'Normal'
}

# Compute accuracy
results = []
for case, correct_option in correct_answers.items():
    total = df[case].notna().sum()
    correct = (df[case].astype(str).str.strip().str.upper() == correct_option).sum()
    accuracy = round((correct / total) * 100, 1) if total > 0 else 0
    results.append({
        'Case': f"{case} ({labels[case]})",
        'Accuracy (%)': f"{accuracy}%"
    })

# Convert to DataFrame and display
accuracy_df = pd.DataFrame(results)
print(accuracy_df)
