"""
Comprehensive Model Evaluation for Healthcare ML
Evaluates ICU prediction models with healthcare-specific metrics
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, roc_curve,
    precision_recall_curve, average_precision_score, f1_score,
    precision_score, recall_score, accuracy_score, balanced_accuracy_score
)
from sklearn.model_selection import cross_val_score, StratifiedKFold
import warnings
warnings.filterwarnings('ignore')

class HealthcareModelEvaluator:
    """Comprehensive evaluation suite for healthcare ML models"""
    
    def __init__(self, model_path='emergency_predictor_stacked.pkl', 
                 scaler_path='scaler.pkl', feature_list_path='feature_list.pkl'):
        """Initialize evaluator with model artifacts"""
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_list = joblib.load(feature_list_path)
            print("✅ Model artifacts loaded successfully")
        except FileNotFoundError as e:
            print(f"❌ Error loading model artifacts: {e}")
            print("Please ensure you have trained the model first using train_advanced_models.py")
    
    def load_test_data(self, X_path='X_train_2025.csv', y_path='y_train_2025.csv', test_size=0.2):
        """Load and split data for evaluation"""
        X_df = pd.read_csv(X_path)
        y_df = pd.read_csv(y_path)
        
        # Combine and preprocess
        df = X_df.copy()
        df['needs_icu'] = y_df['In-hospital_death']
        
        # Use same feature selection as training
        tabular_features = [
            'Age', 'Gender', 'HR_first', 'SysABP_first', 'DiasABP_first',
            'SaO2_first', 'Temp_first', 'RespRate_first', 'GCS_first',
            'Lactate_first', 'SAPS-I'
        ]
        
        # Fill missing values
        for col in tabular_features:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
        
        # Split data (use same random_state as training for consistency)
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            df[tabular_features], df['needs_icu'], 
            test_size=test_size, random_state=42, stratify=df['needs_icu']
        )
        
        return X_test, y_test, X_train, y_train
    
    def calculate_healthcare_metrics(self, y_true, y_pred, y_pred_proba):
        """Calculate comprehensive healthcare-specific metrics"""
        
        # Basic metrics
        accuracy = accuracy_score(y_true, y_pred)
        balanced_acc = balanced_accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)  # Sensitivity
        f1 = f1_score(y_true, y_pred)
        auc_roc = roc_auc_score(y_true, y_pred_proba)
        auc_pr = average_precision_score(y_true, y_pred_proba)
        
        # Confusion matrix components
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        
        # Healthcare-specific metrics
        sensitivity = tp / (tp + fn)  # Same as recall
        specificity = tn / (tn + fp)
        ppv = tp / (tp + fp)  # Positive Predictive Value (same as precision)
        npv = tn / (tn + fn)  # Negative Predictive Value
        fnr = fn / (tp + fn)  # False Negative Rate (critical in healthcare)
        fpr = fp / (tn + fp)  # False Positive Rate
        
        # Clinical impact metrics
        missed_cases_rate = fn / len(y_true)  # Proportion of all cases missed
        unnecessary_admissions_rate = fp / len(y_true)  # Proportion unnecessary
        
        metrics = {
            'Accuracy': accuracy,
            'Balanced Accuracy': balanced_acc,
            'Sensitivity (Recall)': sensitivity,
            'Specificity': specificity,
            'Precision (PPV)': ppv,
            'Negative Predictive Value': npv,
            'F1-Score': f1,
            'AUC-ROC': auc_roc,
            'AUC-PR': auc_pr,
            'False Negative Rate': fnr,
            'False Positive Rate': fpr,
            'Missed Cases Rate': missed_cases_rate,
            'Unnecessary Admissions Rate': unnecessary_admissions_rate,
            'True Positives': tp,
            'True Negatives': tn,
            'False Positives': fp,
            'False Negatives': fn
        }
        
        return metrics
    
    def plot_performance_curves(self, y_true, y_pred_proba, save_plots=True):
        """Plot ROC and Precision-Recall curves"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # ROC Curve
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        auc_roc = roc_auc_score(y_true, y_pred_proba)
        
        ax1.plot(fpr, tpr, color='darkorange', lw=2, 
                label=f'ROC curve (AUC = {auc_roc:.3f})')
        ax1.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', alpha=0.5)
        ax1.set_xlim([0.0, 1.0])
        ax1.set_ylim([0.0, 1.05])
        ax1.set_xlabel('False Positive Rate (1 - Specificity)')
        ax1.set_ylabel('True Positive Rate (Sensitivity)')
        ax1.set_title('ROC Curve - ICU Prediction Model')
        ax1.legend(loc="lower right")
        ax1.grid(alpha=0.3)
        
        # Precision-Recall Curve
        precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
        auc_pr = average_precision_score(y_true, y_pred_proba)
        
        ax2.plot(recall, precision, color='darkorange', lw=2,
                label=f'PR curve (AUC = {auc_pr:.3f})')
        ax2.axhline(y=y_true.mean(), color='navy', linestyle='--', alpha=0.5,
                   label=f'Baseline (prevalence = {y_true.mean():.3f})')
        ax2.set_xlim([0.0, 1.0])
        ax2.set_ylim([0.0, 1.05])
        ax2.set_xlabel('Recall (Sensitivity)')
        ax2.set_ylabel('Precision')
        ax2.set_title('Precision-Recall Curve - ICU Prediction Model')
        ax2.legend()
        ax2.grid(alpha=0.3)
        
        plt.tight_layout()
        
        if save_plots:
            plt.savefig('model_performance_curves.png', dpi=300, bbox_inches='tight')
            print("📊 Performance curves saved as 'model_performance_curves.png'")
        
        plt.show()
    
    def plot_confusion_matrix(self, y_true, y_pred, save_plot=True):
        """Plot enhanced confusion matrix with healthcare context"""
        cm = confusion_matrix(y_true, y_pred)
        
        fig, ax = plt.subplots(1, 1, figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=['Predicted: No ICU', 'Predicted: ICU'],
                   yticklabels=['Actual: No ICU', 'Actual: ICU'], ax=ax)
        
        # Add healthcare context
        ax.text(0.5, -0.1, 'False Positives: Unnecessary ICU admissions', 
                transform=ax.transAxes, ha='center', color='orange', fontweight='bold')
        ax.text(0.5, -0.15, 'False Negatives: Missed critical cases', 
                transform=ax.transAxes, ha='center', color='red', fontweight='bold')
        
        plt.title('Confusion Matrix - ICU Prediction Model\n(Healthcare Context)')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        
        if save_plot:
            plt.savefig('confusion_matrix_healthcare.png', dpi=300, bbox_inches='tight')
            print("📊 Confusion matrix saved as 'confusion_matrix_healthcare.png'")
        
        plt.show()
    
    def cross_validation_analysis(self, X, y, cv_folds=5):
        """Perform cross-validation for robust performance estimation"""
        print(f"\n🔄 Performing {cv_folds}-fold cross-validation...")
        
        cv_scores = {}
        kfold = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        # Different scoring metrics
        scoring_metrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
        
        for metric in scoring_metrics:
            scores = cross_val_score(self.model, X, y, cv=kfold, scoring=metric)
            cv_scores[metric] = {
                'mean': scores.mean(),
                'std': scores.std(),
                'scores': scores
            }
        
        return cv_scores
    
    def generate_evaluation_report(self, save_report=True):
        """Generate comprehensive evaluation report"""
        print("🔍 Starting comprehensive model evaluation...")
        print("=" * 60)
        
        # Load test data
        X_test, y_test, X_train, y_train = self.load_test_data()
        print(f"📊 Test set: {len(X_test)} samples, {y_test.sum()} ICU cases ({y_test.mean():.2%} prevalence)")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = self.calculate_healthcare_metrics(y_test, y_pred, y_pred_proba)
        
        # Print detailed report
        print("\n📋 HEALTHCARE MODEL PERFORMANCE REPORT")
        print("=" * 60)
        
        print("\n🎯 CORE METRICS:")
        print(f"Accuracy: {metrics['Accuracy']:.3f}")
        print(f"Balanced Accuracy: {metrics['Balanced Accuracy']:.3f}")
        print(f"AUC-ROC: {metrics['AUC-ROC']:.3f}")
        print(f"AUC-PR: {metrics['AUC-PR']:.3f}")
        
        print("\n🏥 HEALTHCARE-CRITICAL METRICS:")
        print(f"Sensitivity (Recall): {metrics['Sensitivity (Recall)']:.3f} - Ability to catch ICU cases")
        print(f"Specificity: {metrics['Specificity']:.3f} - Ability to correctly identify non-ICU cases")
        print(f"Precision (PPV): {metrics['Precision (PPV)']:.3f} - Of predicted ICU cases, how many are correct")
        print(f"Negative Predictive Value: {metrics['Negative Predictive Value']:.3f} - Of predicted non-ICU, how many are correct")
        
        print("\n⚠️  CRITICAL ERROR ANALYSIS:")
        print(f"False Negative Rate: {metrics['False Negative Rate']:.3f} - Proportion of ICU cases missed")
        print(f"False Positive Rate: {metrics['False Positive Rate']:.3f} - Proportion of non-ICU cases wrongly flagged")
        print(f"Missed Cases Rate: {metrics['Missed Cases Rate']:.3f} - Missed critical cases / total cases")
        print(f"Unnecessary Admissions Rate: {metrics['Unnecessary Admissions Rate']:.3f} - Unnecessary flags / total cases")
        
        print("\n📊 CONFUSION MATRIX:")
        print(f"True Positives (Correct ICU predictions): {metrics['True Positives']}")
        print(f"True Negatives (Correct non-ICU predictions): {metrics['True Negatives']}")
        print(f"False Positives (Unnecessary ICU predictions): {metrics['False Positives']}")
        print(f"False Negatives (Missed ICU cases): {metrics['False Negatives']}")
        
        # Cross-validation analysis
        cv_scores = self.cross_validation_analysis(X_train, y_train)
        
        print("\n🔄 CROSS-VALIDATION RESULTS (5-fold):")
        for metric, results in cv_scores.items():
            print(f"{metric.upper()}: {results['mean']:.3f} ± {results['std']:.3f}")
        
        # Generate visualizations
        self.plot_performance_curves(y_test, y_pred_proba)
        self.plot_confusion_matrix(y_test, y_pred)
        
        # Save detailed report
        if save_report:
            report_data = {
                'Test Size': len(X_test),
                'ICU Cases': int(y_test.sum()),
                'Prevalence': y_test.mean(),
                **metrics,
                'CV_Results': cv_scores
            }
            
            import json
            with open('model_evaluation_report.json', 'w') as f:
                # Convert numpy types to native Python for JSON serialization
                json_report = {}
                for key, value in report_data.items():
                    if isinstance(value, (np.integer, np.floating)):
                        json_report[key] = float(value)
                    elif isinstance(value, dict):
                        json_report[key] = {k: float(v['mean']) if isinstance(v, dict) and 'mean' in v 
                                           else v for k, v in value.items()}
                    else:
                        json_report[key] = value
                
                json.dump(json_report, f, indent=2)
            
            print("\n💾 Detailed report saved as 'model_evaluation_report.json'")
        
        return metrics, cv_scores

def main():
    """Run comprehensive model evaluation"""
    evaluator = HealthcareModelEvaluator()
    
    try:
        metrics, cv_scores = evaluator.generate_evaluation_report()
        
        print("\n✅ Model evaluation completed successfully!")
        print("\n🎯 KEY RECOMMENDATIONS:")
        
        # Provide actionable insights
        if metrics['Sensitivity (Recall)'] < 0.85:
            print("⚠️  Low sensitivity detected - consider adjusting threshold to catch more ICU cases")
        
        if metrics['False Negative Rate'] > 0.1:
            print("🚨 High false negative rate - missing critical cases, review feature importance")
        
        if metrics['AUC-ROC'] < 0.8:
            print("📈 Consider feature engineering or ensemble methods to improve discrimination")
        
        if metrics['Specificity'] < 0.7:
            print("💰 High false positive rate - may lead to resource waste, consider cost-sensitive learning")
            
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        print("Please ensure the model is trained and artifacts are available")

if __name__ == "__main__":
    main()