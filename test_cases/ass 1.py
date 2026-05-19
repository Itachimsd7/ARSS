# ===============================
# Min-Max Normalization + House Price Prediction
# ===============================

import (


    pandas) as pd


import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# -------------------------------
# 1. Dataset (15 Records)
# -------------------------------
data = pd.DataFrame({
    'area': [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500, 2700, 3000, 3200, 3500, 3700, 4000, 4500],
    'bedrooms': [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5],
    'location': [3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10],
    'age': [20, 15, 12, 10, 8, 7, 6, 5, 5, 4, 3, 3, 2, 2, 1],
    'amenities': [2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
    'price': [150, 200, 240, 300, 350, 380, 420, 480, 520, 580, 620, 700, 750, 820, 900]  # in Lakhs
})

print("===== ORIGINAL DATASET =====")
print(data)

# -------------------------------
# 2. Features & Target
# -------------------------------
X = data[['area', 'bedrooms', 'location', 'age', 'amenities']]
y = data['price']

# -------------------------------
# 3. Train-Test Split
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -------------------------------
# 4. Min-Max Normalization (Manual)
# -------------------------------
min_vals = X_train.min()
max_vals = X_train.max()

X_train_norm = (X_train - min_vals) / (max_vals - min_vals)
X_test_norm = (X_test - min_vals) / (max_vals - min_vals)

print("\n===== NORMALIZED TRAINING DATA =====")
print(X_train_norm)

# -------------------------------
# 5. Train Model
# -------------------------------
model = LinearRegression()
model.fit(X_train_norm, y_train)

# -------------------------------
# 6. Prediction
# -------------------------------
y_pred = model.predict(X_test_norm)

# -------------------------------
# 7. Evaluation
# -------------------------------
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n===== MODEL PERFORMANCE =====")
print(f"MAE  : {mae:.2f} Lakhs")
print(f"RMSE : {rmse:.2f} Lakhs")
print(f"R²   : {r2:.4f}")

# -------------------------------
# 8. Sample Prediction
# -------------------------------
sample_input = pd.DataFrame({
    'area': [2000],
    'bedrooms': [3],
    'location': [7],
    'age': [5],
    'amenities': [7]
})

sample_norm = (sample_input - min_vals) / (max_vals - min_vals)
prediction = model.predict(sample_norm)

print("\n===== SAMPLE PREDICTION =====")
print("Input: Area=2000, Bedrooms=3, Location=7, Age=5, Amenities=7")
print(f"Predicted Price = {prediction[0]:.2f} Lakhs")

print("\nProcess completed successfully.")