import pandas as pd

# Load Excel file (update path as needed)
df = pd.read_excel("IshiharaResults.xlsx")

# Define correct Ishihara answers
correct_answers = {
    'test1': '74', 'test2': '6', 'test3': '16', 'test4': '2', 'test5': '7',
    'test6': '29', 'test7': '5', 'test8': '45', 'test9': '8', 'test10': '97'
}

# Compute Ishihara score and classify
test_columns = list(correct_answers)
df[test_columns] = df[test_columns].astype(str)
correct_series = pd.Series(correct_answers)
df['Correct_Ishihara_Score'] = df[test_columns].eq(correct_series).sum(axis=1)
df['Colorblind Status'] = df['Correct_Ishihara_Score'].apply(lambda x: 'Colorblind' if x < 8 else 'Non-Colorblind')

# Correct options for the test cases
correct_cases = {
    'Case 7': 'A',
    'Case 8': 'B',
    'Case 10': 'A',
    'Case 11': 'B'
}

# Calculate correct percentage
results = []
for case, correct_option in correct_cases.items():
    for group in ['Colorblind', 'Non-Colorblind']:
        subset = df[df['Colorblind Status'] == group]
        total = len(subset)
        correct = (subset[case].astype(str).str.strip() == correct_option).sum()
        percent = round((correct / total) * 100, 1) if total > 0 else 0
        results.append({'Case': case, 'Group': group, 'Percent Correct': f"{percent}%"})

# Create percentage table
table_4_4 = pd.DataFrame(results).pivot(index='Case', columns='Group', values='Percent Correct').reset_index()
table_4_4.columns.name = None

# Add Likely Reason column (you can modify these as needed)
table_4_4['Likely Reason'] = [
    "Some reliance on red-green contrast",
    "Mostly accessible — color-independent cues may dominate",
    "Strong red-green encoding, difficult for colorblind users",
    "Similar limitations as Case 10"
]

# Reorder rows as in thesis: Case 7 → 8 → 10 → 11
desired_order = ['Case 7', 'Case 8', 'Case 10', 'Case 11']
table_4_4 = table_4_4.set_index('Case').loc[desired_order].reset_index()

# Display
print(table_4_4)
