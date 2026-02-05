"""
Quick Model Accuracy Checker
Simple script to quickly check current model performance
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

def quick_accuracy_check(model_path='emergency_predictor_stacked.pkl', 
                        X_path='X_train_2025.csv', y_path='y_train_2025.csv'):
    """Quick accuracy check for your model"""
    
    print("🚀 QUICK MODEL ACCURACY CHECK")
    print("=" * 40)
    
    try:
        # Load model
        model = joblib.load(model_path)
        print("✅ Model loaded successfully")
    except FileNotFoundError:
        print("❌ Model file not found. Please train your model first using:")
        print("python train_advanced_models.py")
        return
    
    try:
        # Load data
        X_df = pd.read_csv(X_path)
        y_df = pd.read_csv(y_path)
        print("✅ Data loaded successfully")
    except FileNotFoundError:
        print("❌ Data files not found. Check if X_train_2025.csv and y_train_2025.csv exist")
        return
    
    # Prepare data (same as training)
    df = X_df.copy()
    df['needs_icu'] = y_df['In-hospital_death']
    
    tabular_features = [
        'Age', 'Gender', 'HR_first', 'SysABP_first', 'DiasABP_first',
        'SaO2_first', 'Temp_first', 'RespRate_first', 'GCS_first',
        'Lactate_first', 'SAPS-I'
    ]
    
    # Fill missing values
    for col in tabular_features:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    # Split data (same random_state as training)
    X_train, X_test, y_train, y_test = train_test_split(
        df[tabular_features], df['needs_icu'], 
        test_size=0.2, random_state=42, stratify=df['needs_icu']
    )
    
    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Calculate key metrics
    auc = roc_auc_score(y_test, y_pred_proba)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    
    sensitivity = tp / (tp + fn)  # Recall
    specificity = tn / (tn + fp)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    
    print(f"\n📊 Dataset Info:")
    print(f"   Test samples: {len(y_test)}")
    print(f"   ICU cases: {y_test.sum()} ({y_test.mean():.1%})")
    print(f"   Non-ICU cases: {len(y_test) - y_test.sum()} ({1-y_test.mean():.1%})")
    
    print(f"\n🎯 Key Performance Metrics:")
    print(f"   Overall Accuracy: {accuracy:.3f} ({accuracy:.1%})")
    print(f"   AUC-ROC Score: {auc:.3f}")
    print(f"   Sensitivity (Recall): {sensitivity:.3f} - Catches {sensitivity:.1%} of ICU cases")
    print(f"   Specificity: {specificity:.3f} - Correctly identifies {specificity:.1%} of non-ICU")
    print(f"   Precision: {precision:.3f} - {precision:.1%} of ICU predictions are correct")
    
    print(f"\n⚠️  Critical Errors:")
    print(f"   False Negatives: {fn} (missed ICU cases)")
    print(f"   False Positives: {fp} (unnecessary ICU predictions)")
    print(f"   False Negative Rate: {fn/(tp+fn):.3f} ({fn/(tp+fn):.1%} of ICU cases missed)")
    
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['No ICU', 'ICU']))
    
    # Quick assessment
    print(f"\n🔍 Quick Assessment:")
    if auc >= 0.9:
        print("🏆 EXCELLENT model performance (AUC ≥ 0.9)")
    elif auc >= 0.8:
        print("✅ GOOD model performance (AUC ≥ 0.8)")
    elif auc >= 0.7:
        print("⚠️  FAIR model performance (AUC ≥ 0.7)")
    else:
        print("❌ POOR model performance (AUC < 0.7)")
    
    if sensitivity >= 0.9:
        print("🎯 High sensitivity - Good at catching ICU cases")
    elif sensitivity >= 0.8:
        print("👍 Decent sensitivity - Catches most ICU cases")
    else:
        print("⚠️  Low sensitivity - Missing too many ICU cases")
    
    if fn > 0:
        print(f"🚨 {fn} critical cases were missed - consider lowering prediction threshold")
    
    if fp > 20:
        print(f"💰 {fp} unnecessary ICU predictions - consider raising threshold to reduce false alarms")

if __name__ == "__main__":
    quick_accuracy_check()