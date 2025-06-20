import pandas as pd
import matplotlib.pyplot as plt

# Load Excel data
df = pd.read_excel("IshiharaResults.xlsx")

# Define correct answers for Ishihara test
correct_answers = {
    'test1': '74', 'test2': '6', 'test3': '16', 'test4': '2', 'test5': '7',
    'test6': '29', 'test7': '5', 'test8': '45', 'test9': '8', 'test10': '97'
}

# Recalculate score and classify vision status
test_columns = list(correct_answers.keys())
df[test_columns] = df[test_columns].astype(str)
correct_series = pd.Series(correct_answers)
df['Correct_Ishihara_Score'] = df[test_columns].eq(correct_series).sum(axis=1)
df['Colorblind Status'] = df['Correct_Ishihara_Score'].apply(lambda x: 'Colorblind' if x < 8 else 'Non-Colorblind')

# Define correct option per test case
correct_cases = {
    'Case 7': 'A',
    'Case 8': 'B',
    'Case 10': 'A',
    'Case 11': 'B'
}

# Count correct responses for each group and case
data = []
for case, correct_option in correct_cases.items():
    for group in ['Colorblind', 'Non-Colorblind']:
        subset = df[df['Colorblind Status'] == group]
        correct_count = (subset[case].astype(str).str.strip() == correct_option).sum()
        data.append({'Case': case, 'Group': group, 'Correct': correct_count})

# Create DataFrame for plotting
plot_df = pd.DataFrame(data)

# Pivot for grouped bar chart
pivot_df = plot_df.pivot(index='Case', columns='Group', values='Correct').reindex(['Case 7', 'Case 8', 'Case 10', 'Case 11'])

# Plot
colors = {'Colorblind': '#6BAED6', 'Non-Colorblind': '#FDAE6B'}
ax = pivot_df.plot(kind='bar', figsize=(8, 5), color=[colors[col] for col in pivot_df.columns])

plt.title('Correct Answers by Case and Color Vision Status')
plt.xlabel('Case')
plt.ylabel('Number of Correct Responses')
plt.legend(title='Group')
plt.tight_layout()

# Save figure
plt.savefig("figure_4_4_correct_answers_grouped.png")
plt.show()
