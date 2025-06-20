import pandas as pd

# Load the Excel file
df = pd.read_excel("../Dataset/AuditoryTestResults.xlsx")  # Adjust path if needed

# Normalize the noise rating responses
mapping = {
    "😃\nNo Noise": "1 = No Noise",
    "😃\nNo noise": "1 = No Noise",
    "😐\nLittle noticeable": "3 = Slightly Noticeable",
    "😐\nSlightly noticeable": "3 = Slightly Noticeable",
    "😞\nNoticeable": "4 = Noticeable",
    "😠\nIntrusive": "5 = Intrusive",
    "🙂\nNot Noticeable": "2 = Not Noticeable"
}

# Apply mapping
df['Noise Level'] = df['noiseEmojiRating'].map(mapping)

# Count and sort noise level responses
noise_counts = df['Noise Level'].value_counts().sort_index().reset_index()
noise_counts.columns = ['Noise Level', 'Participants (n)']

# Display table
print(noise_counts)
