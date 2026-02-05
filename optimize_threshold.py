"""
Threshold Optimization for Healthcare ML Models
Finds optimal prediction threshold balancing sensitivity and specificity
"""

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import precision_recall_curve, roc_curve
import warnings
warnings.filterwarnings('ignore')

class ThresholdOptimizer:
    """Optimize prediction threshold for healthcare applications"""
    
    def __init__(self, model_path='emergency_predictor_stacked.pkl'):
        """Initialize with trained model"""
        try:
            self.model = joblib.load(model_path)
            print("✅ Model loaded successfully")
        except FileNotFoundError:
            print("❌ Model not found. Please train the model first.")
    
    def load_test_data(self, X_path='X_train_2025.csv', y_path='y_train_2025.csv'):
        """Load and prepare test data"""
        X_df = pd.read_csv(X_path)
        y_df = pd.read_csv(y_path)
        
        # Prepare features (same as training)
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
        
        # Split data
        from sklearn.model_selection import train_test_split
        _, X_test, _, y_test = train_test_split(
            df[tabular_features], df['needs_icu'], 
            test_size=0.2, random_state=42, stratify=df['needs_icu']
        )
        
        return X_test, y_test
    
    def find_optimal_thresholds(self, X_test, y_test):
        """Find optimal thresholds using different criteria"""
        
        # Get prediction probabilities
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate precision-recall curve
        precision, recall, pr_thresholds = precision_recall_curve(y_test, y_pred_proba)
        
        # Calculate ROC curve
        fpr, tpr, roc_thresholds = roc_curve(y_test, y_pred_proba)
        
        # Method 1: Maximize F1-Score
        f1_scores = 2 * (precision[:-1] * recall[:-1]) / (precision[:-1] + recall[:-1])
        optimal_f1_idx = np.argmax(f1_scores)
        optimal_f1_threshold = pr_thresholds[optimal_f1_idx]
        
        # Method 2: Youden's Index (maximize sensitivity + specificity - 1)
        youdens_index = tpr - fpr
        optimal_youden_idx = np.argmax(youdens_index)
        optimal_youden_threshold = roc_thresholds[optimal_youden_idx]
        
        # Method 3: Balance sensitivity and specificity (closest to top-left corner)
        distances = np.sqrt((1 - tpr)**2 + fpr**2)
        optimal_balance_idx = np.argmin(distances)
        optimal_balance_threshold = roc_thresholds[optimal_balance_idx]
        
        # Method 4: Prioritize sensitivity (healthcare critical)
        # Find threshold where sensitivity >= 0.9
        high_sensitivity_indices = np.where(tpr >= 0.9)[0]
        if len(high_sensitivity_indices) > 0:
            # Among high sensitivity thresholds, pick one with best specificity
            best_spec_idx = high_sensitivity_indices[np.argmax(1 - fpr[high_sensitivity_indices])]
            optimal_sensitivity_threshold = roc_thresholds[best_spec_idx]
        else:
            optimal_sensitivity_threshold = 0.3  # Conservative default
        
        # Method 5: Cost-sensitive (assuming FN cost 5x higher than FP)
        fn_cost = 5  # Missing ICU case is 5x costlier than unnecessary admission
        fp_cost = 1
        costs = fn_cost * (1 - tpr) * y_test.mean() + fp_cost * fpr * (1 - y_test.mean())
        optimal_cost_idx = np.argmin(costs)
        optimal_cost_threshold = roc_thresholds[optimal_cost_idx]
        
        thresholds_info = {
            'F1-Optimized': {
                'threshold': optimal_f1_threshold,
                'f1_score': f1_scores[optimal_f1_idx],
                'precision': precision[optimal_f1_idx],
                'recall': recall[optimal_f1_idx]
            },
            'Youden-Index': {
                'threshold': optimal_youden_threshold,
                'sensitivity': tpr[optimal_youden_idx],
                'specificity': 1 - fpr[optimal_youden_idx],
                'youden_index': youdens_index[optimal_youden_idx]
            },
            'Balanced': {
                'threshold': optimal_balance_threshold,
                'sensitivity': tpr[optimal_balance_idx],
                'specificity': 1 - fpr[optimal_balance_idx],
                'distance': distances[optimal_balance_idx]
            },
            'High-Sensitivity': {
                'threshold': optimal_sensitivity_threshold,
                'note': 'Prioritizes catching ICU cases'
            },
            'Cost-Sensitive': {
                'threshold': optimal_cost_threshold,
                'sensitivity': tpr[optimal_cost_idx],
                'specificity': 1 - fpr[optimal_cost_idx],
                'cost': costs[optimal_cost_idx]
            }
        }
        
        return thresholds_info, (precision, recall, pr_thresholds), (fpr, tpr, roc_thresholds)
    
    def evaluate_threshold_performance(self, X_test, y_test, threshold):
        """Evaluate model performance at specific threshold"""
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        y_pred = (y_pred_proba >= threshold).astype(int)
        
        from sklearn.metrics import confusion_matrix, classification_report
        
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        metrics = {
            'Sensitivity': tp / (tp + fn),
            'Specificity': tn / (tn + fp),
            'Precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
            'NPV': tn / (tn + fn) if (tn + fn) > 0 else 0,
            'Accuracy': (tp + tn) / (tp + tn + fp + fn),
            'FNR': fn / (tp + fn),
            'FPR': fp / (tn + fp),
            'TP': tp, 'TN': tn, 'FP': fp, 'FN': fn
        }
        
        return metrics
    
    def plot_threshold_analysis(self, precision, recall, pr_thresholds, fpr, tpr, roc_thresholds, thresholds_info):
        """Plot threshold analysis visualization"""
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        
        # 1. Precision-Recall vs Threshold
        ax1.plot(pr_thresholds, precision[:-1], 'b-', label='Precision', alpha=0.8)
        ax1.plot(pr_thresholds, recall[:-1], 'r-', label='Recall', alpha=0.8)
        ax1.axvline(thresholds_info['F1-Optimized']['threshold'], color='green', 
                   linestyle='--', label=f"F1-Optimal ({thresholds_info['F1-Optimized']['threshold']:.3f})")
        ax1.set_xlabel('Threshold')
        ax1.set_ylabel('Score')
        ax1.set_title('Precision & Recall vs Threshold')
        ax1.legend()
        ax1.grid(alpha=0.3)
        
        # 2. Sensitivity-Specificity vs Threshold
        specificity = 1 - fpr
        ax2.plot(roc_thresholds, tpr, 'g-', label='Sensitivity (TPR)', alpha=0.8)
        ax2.plot(roc_thresholds, specificity, 'm-', label='Specificity (1-FPR)', alpha=0.8)
        ax2.axvline(thresholds_info['Youden-Index']['threshold'], color='orange', 
                   linestyle='--', label=f"Youden Optimal ({thresholds_info['Youden-Index']['threshold']:.3f})")
        ax2.set_xlabel('Threshold')
        ax2.set_ylabel('Score')
        ax2.set_title('Sensitivity & Specificity vs Threshold')
        ax2.legend()
        ax2.grid(alpha=0.3)
        
        # 3. F1-Score vs Threshold
        f1_scores = 2 * (precision[:-1] * recall[:-1]) / (precision[:-1] + recall[:-1])
        ax3.plot(pr_thresholds, f1_scores, 'purple', alpha=0.8)
        max_f1_idx = np.argmax(f1_scores)
        ax3.axvline(pr_thresholds[max_f1_idx], color='red', linestyle='--', 
                   label=f'Max F1 at {pr_thresholds[max_f1_idx]:.3f}')
        ax3.set_xlabel('Threshold')
        ax3.set_ylabel('F1-Score')
        ax3.set_title('F1-Score vs Threshold')
        ax3.legend()
        ax3.grid(alpha=0.3)
        
        # 4. ROC Curve with optimal points
        ax4.plot(fpr, tpr, 'b-', alpha=0.8, label='ROC Curve')
        ax4.plot([0, 1], [0, 1], 'k--', alpha=0.5)
        
        # Mark optimal points
        for method, info in thresholds_info.items():
            if 'sensitivity' in info and 'specificity' in info:
                sens = info['sensitivity']
                spec = info['specificity']
                ax4.plot(1-spec, sens, 'o', markersize=8, label=f'{method} ({info["threshold"]:.3f})')
        
        ax4.set_xlabel('False Positive Rate')
        ax4.set_ylabel('True Positive Rate')
        ax4.set_title('ROC Curve with Optimal Thresholds')
        ax4.legend()
        ax4.grid(alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('threshold_analysis.png', dpi=300, bbox_inches='tight')
        print("📊 Threshold analysis saved as 'threshold_analysis.png'")
        plt.show()
    
    def run_analysis(self):
        """Run complete threshold optimization analysis"""
        print("🎯 Starting Threshold Optimization Analysis")
        print("=" * 50)
        
        # Load test data
        X_test, y_test = self.load_test_data()
        print(f"📊 Test set: {len(X_test)} samples, {y_test.sum()} ICU cases")
        
        # Find optimal thresholds
        thresholds_info, pr_data, roc_data = self.find_optimal_thresholds(X_test, y_test)
        
        print("\n🎯 OPTIMAL THRESHOLDS BY DIFFERENT CRITERIA:")
        print("-" * 50)
        
        for method, info in thresholds_info.items():
            print(f"\n{method}:")
            print(f"  Threshold: {info['threshold']:.3f}")
            if 'f1_score' in info:
                print(f"  F1-Score: {info['f1_score']:.3f}")
                print(f"  Precision: {info['precision']:.3f}")
                print(f"  Recall: {info['recall']:.3f}")
            if 'sensitivity' in info:
                print(f"  Sensitivity: {info['sensitivity']:.3f}")
                print(f"  Specificity: {info.get('specificity', 'N/A')}")
            if 'note' in info:
                print(f"  Note: {info['note']}")
        
        print("\n📊 DETAILED PERFORMANCE AT EACH THRESHOLD:")
        print("-" * 50)
        
        for method, info in thresholds_info.items():
            threshold = info['threshold']
            metrics = self.evaluate_threshold_performance(X_test, y_test, threshold)
            
            print(f"\n{method} (Threshold: {threshold:.3f}):")
            print(f"  Sensitivity: {metrics['Sensitivity']:.3f} (catch {metrics['Sensitivity']:.1%} of ICU cases)")
            print(f"  Specificity: {metrics['Specificity']:.3f} (correctly ID {metrics['Specificity']:.1%} of non-ICU)")
            print(f"  Precision: {metrics['Precision']:.3f} ({metrics['Precision']:.1%} of ICU predictions are correct)")
            print(f"  False Negatives: {metrics['FN']} (missed ICU cases)")
            print(f"  False Positives: {metrics['FP']} (unnecessary ICU predictions)")
        
        # Create visualizations
        self.plot_threshold_analysis(*pr_data, *roc_data, thresholds_info)
        
        print("\n✅ Threshold optimization completed!")
        
        print("\n🎯 RECOMMENDATIONS:")
        print("-" * 30)
        print("For HEALTHCARE applications, consider:")
        print(f"• High-Sensitivity threshold ({thresholds_info['High-Sensitivity']['threshold']:.3f}) - Catches most ICU cases")
        print(f"• Cost-Sensitive threshold ({thresholds_info['Cost-Sensitive']['threshold']:.3f}) - Balances costs")
        print(f"• F1-Optimized threshold ({thresholds_info['F1-Optimized']['threshold']:.3f}) - General balance")
        
        return thresholds_info

def main():
    """Run threshold optimization"""
    optimizer = ThresholdOptimizer()
    try:
        thresholds_info = optimizer.run_analysis()
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        print("Please ensure the model is trained and data files are available")

if __name__ == "__main__":
    main()