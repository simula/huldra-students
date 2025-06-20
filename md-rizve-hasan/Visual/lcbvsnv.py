import pandas as pd
import matplotlib.pyplot as plt

# Load the Excel file
df = pd.read_excel("IshiharaResults.xlsx")

# Define correct answers for the Ishihara test (Plates 1–10)
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

# Extract answers and calculate correct score
test_columns = list(correct_answers.keys())
df[test_columns] = df[test_columns].astype(str)
correct_series = pd.Series(correct_answers)
df['Correct_Ishihara_Score'] = df[test_columns].eq(correct_series).sum(axis=1)

# Classify based on score threshold
df['Classification'] = df['Correct_Ishihara_Score'].apply(
    lambda x: 'Likely Color Blind (LCB)' if x < 8 else 'Normal Vision (NV)'
)

# Count participants by classification
classification_counts = df['Classification'].value_counts()

# Create the pie chart
labels = classification_counts.index.tolist()
sizes = classification_counts.values.tolist()
colors = ['orangered', 'orange']  # Ensure consistent color order

plt.figure(figsize=(6, 6))
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
plt.title('Vision Classification Breakdown')
plt.axis('equal')

# Save or show the chart
plt.savefig("figure_4_1_vision_pie_chart.png")
plt.show()
