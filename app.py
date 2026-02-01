import os
import pandas as pd
import joblib
import requests # The library for making web requests
from flask import Flask, render_template, request, redirect, url_for, flash
from models import db, Patient

# --- App Initialization ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'a_very_secret_key'
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'database.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    os.makedirs(os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance'))
except OSError:
    pass
db.init_app(app)

# --- Load LOCAL AI Models and Scaler ---
MODEL_PATH = 'emergency_predictor_stacked.pkl'
SCALER_PATH = 'scaler.pkl'
FEATURE_LIST_PATH = 'feature_list.pkl'

predictor = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
model_features = joblib.load(FEATURE_LIST_PATH)
print("✅ Stacking Model and Scaler loaded successfully.")

# --- Hugging Face API Configuration ---
# We no longer load the summarizer model locally.
API_URL = "https://api-inference.huggingface.co/models/t5-small"
# IMPORTANT: Set your token as an environment variable for security
# or replace "YOUR_TOKEN_HERE" for a quick test (not recommended for production)
HF_TOKEN = os.getenv("HF_TOKEN")
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

# This is the new function that calls the API
def query_huggingface_api(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        # If the API fails, return a default error message
        print(f"Hugging Face API Error: {response.status_code} - {response.text}")
        return [{"summary_text": "Generative summary could not be produced at this time."}]

# --- Other configuration ---
DEFAULT_VALUES = { 'GCS_first': 14.0, 'Lactate_first': 2.0, 'SAPS-I': 38.0 }

with app.app_context():
    db.create_all()

def make_prediction(form_data):
    patient_features_full = DEFAULT_VALUES.copy()
    patient_features_full.update({
        'Age': float(form_data['age']), 'Gender': 1 if form_data['gender'].lower() == 'male' else 0,
        'HR_first': float(form_data['heart_rate']), 'SysABP_first': float(form_data['systolic_blood_pressure']),
        'DiasABP_first': float(form_data['diastolic_blood_pressure']), 'SaO2_first': float(form_data['oxygen_saturation']),
        'Temp_first': float(form_data['temperature']), 'RespRate_first': float(form_data['respiratory_rate']),
    })
    
    df_full = pd.DataFrame([patient_features_full], columns=model_features)
    scaled_features_full = scaler.transform(df_full)
    scaled_features_full_df = pd.DataFrame(scaled_features_full, columns=model_features)
    
    final_features_for_model = scaled_features_full_df[predictor.feature_names_in_]
    
    prediction_result = predictor.predict(final_features_for_model)[0]
    risk_proba = predictor.predict_proba(final_features_for_model)[0][1]
    
    prompt = f"""Summarize this patient case for an ER doctor: 
    A {form_data['age']}-year-old {form_data['gender']} presents with critical vitals.
    - Heart Rate: {form_data['heart_rate']} bpm
    - Blood Pressure: {form_data['systolic_blood_pressure']}/{form_data['diastolic_blood_pressure']} mmHg
    - O2 Saturation: {form_data['oxygen_saturation']}%
    """
    # Call the new API function instead of the local pipeline
    summary_json = query_huggingface_api({"inputs": prompt})
    summary_text = summary_json[0].get('summary_text', 'Summary generation failed.')

    return {
        'risk_score': float(risk_proba),
        'predicted_icu_need': bool(prediction_result == 1),
        'summary': summary_text
    }

# --- Routes (No changes needed) ---
@app.route('/report', methods=['GET', 'POST'])
def report():
    if request.method == 'POST':
        try:
            prediction = make_prediction(request.form)
            new_patient = Patient(
                age=int(request.form['age']), gender=request.form['gender'],
                heart_rate=int(request.form['heart_rate']),
                blood_pressure_systolic=int(request.form['systolic_blood_pressure']),
                blood_pressure_diastolic=int(request.form['diastolic_blood_pressure']),
                oxygen_saturation=float(request.form['oxygen_saturation']),
                temperature=float(request.form['temperature']),
                respiratory_rate=int(request.form['respiratory_rate']),
                paramedic_notes=request.form.get('paramedic_notes', ''),
                location=request.form.get('location', ''),
                predicted_icu_need=prediction['predicted_icu_need'],
                risk_score=prediction['risk_score'],
                generative_summary=prediction['summary']
            )
            db.session.add(new_patient)
            db.session.commit()
            flash(f"Patient report #{new_patient.id} analyzed successfully.", 'success')
            return redirect(url_for('patient_detail', patient_id=new_patient.id))
        except Exception as e:
            db.session.rollback()
            flash(f"Error submitting report: {e}", 'error')
            import traceback
            traceback.print_exc()
            return redirect(url_for('report'))
    return render_template('report.html')

@app.route('/')
def index(): return render_template('index.html')
    
@app.route('/dashboard')
def dashboard():
    patients = Patient.query.order_by(Patient.timestamp.desc()).all()
    return render_template('dashboard.html', patients=patients)

@app.route('/patient/<int:patient_id>')
def patient_detail(patient_id):
    patient = db.get_or_404(Patient, patient_id)
    return render_template('patient.html', patient=patient)
    
if __name__ == '__main__':
    app.run(debug=True)