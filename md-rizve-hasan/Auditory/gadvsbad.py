import pandas as pd

# Load the updated Excel file
df = pd.read_excel("../Dataset/AuditoryTestResults.xlsx")


# Extract the numeric score from strings like "7/10"
df['AudioScore'] = df['Rate the audio quality from 1 (very poor) to 10 (excellent)'] \
    .astype(str).str.extract(r'(\d+)').astype(float)

# Classify participants based on score
df['Device Quality'] = df['AudioScore'].apply(
    lambda x: 'Bad Audio Device (1–6)' if x <= 6 else 'Good Audio Device (7–10)'
)

# Count participants and calculate percentages
summary = df['Device Quality'].value_counts().reset_index()
summary.columns = ['Device Quality', 'Participants (n)']
total = summary['Participants (n)'].sum()
summary['% of Sample'] = (summary['Participants (n)'] / total * 100).round(1).astype(str) + '%'

# Sort the table for readability
summary = summary.sort_values(by='Device Quality', ascending=True).reset_index(drop=True)

# Display result
print(summary)
