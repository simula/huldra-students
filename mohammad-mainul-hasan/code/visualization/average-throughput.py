import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Explicitly provided throughput data recalculated
data = {
    "Storage Solutions": [
        "Local Storage", "Firebase", "AWS S3", "Azure Blob",
        "Dropbox", "OneDrive", "Google Drive"
    ],
    "Average Throughput (KB/s)": [
        np.mean([26881.37,   633.97, 219974.27,  1016.38, 179195.16,  989.39,  21908.02,  992.98,
                 128228.52, 1010.65,  79695.54,  989.02,  47596.32,   471.99, 215887.01,   979.87,
                 251879.44, 15530.94,  16609.55,  773.27,  72440.14,  999.45,  82215.33,  993.11,
                 33930.13,  1619.83, 287356.93,  1032.45,  20504.08, 1709.93, 154591.93, 1031.86,
                    45.90,  260.26,  2925.45,  255.62]),
        np.mean([3504.89, 2951, 25278.06, 10130.24, 91432.47, 10876.24, 1326.15, 1391.30,
                 10662.13, 2021.74, 42566.29, 5184.74, 2569.05, 157.41, 29070.58, 2302.51,
                 59386.63, 15530.94, 1189.29, 110.31, 13690.42, 1284.53, 28780.81, 3694.41,
                 2121.39, 683.91, 26123.10, 2440.96,  929.22, 783.36,  8859.89, 1619.24,
                    45.90,   12.83,   85.15,   8.48]),
        np.mean([7095.38, 1249, 24149.09,  931.58, 26619.14,  921.97, 2001.41, 1309.38,
                 11488.81, 910.81, 27628.22, 949.49, 7684.09,  675.01, 23369.67,  944.71,
                 20562.23,  875.84, 1777.24,  678.26, 15516.94, 918.48, 17717.60, 928.63,
                  8246.37, 1115.78, 22595.70, 1008.50, 1572.77, 1145.53, 13116.68, 985.19,
                   730.83,  134.80,  146.87, 124.77]),
        np.mean([11189.33, 1504.41, 16766.52, 1033.60, 22067.25, 994.23, 2955.69, 1150.78,
                 13781.69, 998.27, 12342.92, 950.56, 11942.90,  520.64, 17580.21,  476.52,
                 20799.93,  907.76, 2708.15,  516.71, 12666.86, 814.18, 17504.89, 940.88,
                  8639.87,  146.16, 17279.80,  792.71, 2617.99, 1184.07, 12691.75,1029.22,
                  2335.88,    3.89,  211.15,  63.33]),
        np.mean([695.78, 694.34, 5636.42, 5552.85, 18260.17, 18861.23, 21032.79, 1042.04,
                  7663.42, 8226.89, 13700.39,25706.12,  621.46,  595.76,  6510.65,  6011.04,
                 15331.17, 17701.52,  985.03,  897.23,  7467.25, 9215.77,11160.82,21420.31,
                  580.49,  592.73,  5715.55, 5099.92,  989.85,  872.60,  8302.35, 7470.16,
                   48.77,   46.84,   84.61,   71.92]),
        np.mean([5654.54, 2613.85,10541.69,15251.52,11989.85,54721.93, 2561.35,2436.74,
                  5557.29,12108.96,13381.22,18292.68, 4277.56,1925.97,11693.82, 8629.40,
                 12999.19,40607.79, 2049.34, 1883.13,  9348.25, 6534.09, 8499.39,5704.78,
                  4206.17,2311.51, 7702.93,16440.15,1689.79,1365.91,10214.94,12185.53,
                   288.67,  221.90,  152.90,  132.74]),
        np.mean([849.88,  858.39, 5639.87, 1447.49,15725.25,5612.87,1196.34,1524.26,
                  7270.64,1626.91,18128.89,4289.15,  721.89,  730.88,  6899.98,  911.23,
                 13363.82,2330.33,1031.66, 105.44,  8521.04,1265.27,18773.37,2747.00,
                   595.00,   74.93,  3673.19,  662.38, 1068.44, 469.26,  9370.30,1372.80,
                    67.42,    6.39,    98.47,   37.47])
    ]
}

df = pd.DataFrame(data)
df.set_index('Storage Solutions', inplace=True)

# Plot with sky-blue bars, black edges, and labels
fig, ax = plt.subplots(figsize=(12, 6))
df.plot(kind='bar', ax=ax, color='skyblue', edgecolor='black')

# Annotate each bar with its height
ax.bar_label(ax.containers[0], fmt="%.2f", padding=3)

ax.set_title('Comparative Average Throughput across Storage Solutions')
ax.set_ylabel('Average Throughput (KB/s)')
ax.set_xlabel('Storage Solutions')
ax.tick_params(axis='x', rotation=45)
ax.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
plt.show()