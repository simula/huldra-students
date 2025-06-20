# Import necessary libraries
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

audio_data_combined = {
    'Condition': [
        'Small-Normal-EU', 'Small-Fast4G-EU', 'Medium-Normal-EU', 'Medium-Fast4G-EU',
        'Large-Normal-EU', 'Large-Fast4G-EU', 'Small-Normal-US', 'Small-Fast4G-US',
        'Medium-Normal-US', 'Medium-Fast4G-US', 'Large-Normal-US', 'Large-Fast4G-US'
    ],
    'Local': [11.32, 1099.38, 31.97, 6161.93, 70.78, 15657.92, 35.33, 743.35, 86.21, 6041.12, 297.36, 15638.80],
    'Firebase': [214.25, 3400.82, 209.64, 2622.33, 266.14, 3423.31, 440.80, 4777.34, 441.15, 5074.29, 511.73, 4890.77],
    'AWS': [67.67, 768.56, 262.16, 6391.27, 864.62, 17763.11, 291.94, 1092.86, 391.74, 6580.57, 978.15, 16734.63],
    'Azure': [43.46, 1177.17, 350.85, 12708.88, 776.63, 17165.71, 191.58, 1186.92, 530.91, 7543.51, 973.35, 16710.93],
    'Dropbox': [835.68, 871.16, 927.69, 1005.69, 1014.80, 885.68, 528.07, 592.94, 890.75, 665.20, 1392.81, 737.69],
    'OneDrive': [123.58, 334.76, 516.73, 479.84, 1195.10, 403.90, 254.72, 282.70, 650.56, 928.98, 2432.07, 682.96],
    'GoogleDrive': [737.86, 1287.77, 875.29, 6744.93, 1164.65, 6792.75, 512.66, 5170.01, 711.22, 5175.57, 834.84, 5715.85]
}

# Convert data to DataFrame
df_audio_combined = pd.DataFrame(audio_data_combined)

# Melt DataFrame for boxplot visualization
df_audio_melted = df_audio_combined.melt(id_vars='Condition', var_name='Storage Provider', value_name='Average Fetch Time (ms)')

# Plotting the boxplot
plt.figure(figsize=(16, 9))
sns.boxplot(x='Storage Provider', y='Average Fetch Time (ms)', data=df_audio_melted)

# Enhancing plot clarity and readability
plt.title('Fetch-Time Variability and Median Performance for MP3 Audio Files', fontsize=16)
plt.ylabel('Average Fetch Time (ms)', fontsize=14)
plt.xlabel('Storage Provider', fontsize=14)
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.show()