import pandas as pd

# Load the Excel file
df = pd.read_excel("IshiharaResults.xlsx")

# Convert difficulty column to numeric
df['How difficult it was on a scale of 10?'] = pd.to_numeric(
    df['How difficult it was on a scale of 10?'], errors='coerce'
)

# Define correct answers to Ishihara test
correct_answers = {
    'test1': '74', 'test2': '6', 'test3': '16', 'test4': '2', 'test5': '7',
    'test6': '29', 'test7': '5', 'test8': '45', 'test9': '8', 'test10': '97'
}

# Compute correct scores
test_columns = list(correct_answers.keys())
df[test_columns] = df[test_columns].astype(str)
correct_series = pd.Series(correct_answers)
df['Correct_Ishihara_Score'] = df[test_columns].eq(correct_series).sum(axis=1)

# Classify participants
df['Colorblind Status'] = df['Correct_Ishihara_Score'].apply(
    lambda x: 'Colorblind' if x < 8 else 'Non-Colorblind'
)

# Calculate summary table
summary = df.groupby('Colorblind Status').agg(
    Participants=('Colorblind Status', 'count'),
    Avg_Difficulty=('How difficult it was on a scale of 10?', 'mean')
).reset_index()

# Rename and round
summary = summary.rename(columns={
    'Colorblind Status': 'Group',
    'Avg_Difficulty': 'Avg. Difficulty (1–10)'
})
summary['Avg. Difficulty (1–10)'] = summary['Avg. Difficulty (1–10)'].round(2)

# Show the result
print(summary)