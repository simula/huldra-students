import pandas as pd

# Load your data (adjust the path if needed)
df = pd.read_excel("IshiharaResults.xlsx")

# Define correct answers for each plate
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

# Extract only the test columns
test_columns = list(correct_answers.keys())
answers_df = df[test_columns].astype(str)

# Create a Series for the correct answers
correct_series = pd.Series(correct_answers)

# Compare participant answers with correct answers
df['Correct_Ishihara_Score'] = answers_df.eq(correct_series).sum(axis=1)

# Classify participants based on score threshold
df['Classification'] = df['Correct_Ishihara_Score'].apply(
    lambda x: 'Likely Color Blind' if x < 8 else 'Normal Vision'
)

# Summarize into a table
summary = df.groupby('Correct_Ishihara_Score').size().reset_index(name='n')
summary['Classification'] = summary['Correct_Ishihara_Score'].apply(
    lambda x: 'Likely Color Blind' if x < 8 else 'Normal Vision'
)

# Optional: Add a total row
total_row = pd.DataFrame([{
    'Correct_Ishihara_Score': 'Total',
    'n': summary['n'].sum(),
    'Classification': ''
}])
summary_table = pd.concat([summary, total_row], ignore_index=True)

# Show the table
print(summary_table)
