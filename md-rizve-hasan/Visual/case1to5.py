import pandas as pd

# Load Excel file
df = pd.read_excel("IshiharaResults.xlsx")

# Correct answers to the 10 Ishihara plates
correct_answers = {
    'test1': '74',
    'test2': '6',
    'test3': '16',
    'test4': '2',
    'test5': '7',
    'test6': '29',
    'test7': '5',
    'test8': '45',
    'test9': '8',
    'test10': '97'
}

# Calculate number of correct answers
test_columns = list(correct_answers.keys())
df[test_columns] = df[test_columns].astype(str)
correct_series = pd.Series(correct_answers)
df['Correct_Ishihara_Score'] = df[test_columns].eq(correct_series).sum(axis=1)

# Classify participants
df['Colorblind Status'] = df['Correct_Ishihara_Score'].apply(
    lambda x: 'Colorblind' if x < 8 else 'Non-Colorblind'
)

# Define cases to analyze
case_columns = ['Case 1', 'Case 2', 'Case 3', 'Case 4', 'Case 5']

# Build the summary table
rows = []
for case in case_columns:
    for group in ['Non-Colorblind', 'Colorblind']:
        subset = df[df['Colorblind Status'] == group]
        a_count = (subset[case].str.strip() == 'A').sum()
        b_count = (subset[case].str.strip() == 'B').sum()
        rows.append({
            'Case': case,
            'Colorblind Status': group,
            'Option A': a_count,
            'Option B': b_count
        })

# Convert to DataFrame and print
table_4_2 = pd.DataFrame(rows)
print(table_4_2)
