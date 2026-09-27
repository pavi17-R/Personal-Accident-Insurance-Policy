import numpy as np, pandas as pd, json, os
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score

# =====================================================================
# Reproducible training script for the two AI models used by the app:
#   1. Underwriting Risk Tier model  -> ml/risk_model.json
#   2. Claims Fraud Detection model  -> ml/fraud_model.json
# Run with:  pip install scikit-learn pandas numpy && python3 train_models.py
# Both models are logistic regression trained on a synthetic-but-realistic
# dataset generated below (rule-based ground truth + Gaussian noise), since
# no real insurer claims/underwriting data is available for a student
# project. The JSON files this script writes are the exact ones consumed
# by backend/services/mlService.js at runtime (plain-JS inference — no
# Python needed once trained).
# =====================================================================
np.random.seed(42)
N = 4000
OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT, exist_ok=True)

# =====================================================================
# 1. RISK / UNDERWRITING MODEL  (multinomial: Low / Medium / High)
# =====================================================================
age = np.random.randint(18, 66, N)
occupation_risk = np.random.choice([0,1,2], N, p=[0.55,0.30,0.15])  # 0=Low(office),1=Medium(field/travel),2=High(hazardous)
coverage_type = np.random.choice([0,1,2], N, p=[0.35,0.40,0.25])    # Basic/Standard/Comprehensive
sum_insured = np.random.choice([200000,300000,500000,750000,1000000,1500000], N)
prior_claims = np.random.poisson(0.3, N).clip(0,4)
tenure_years = np.random.choice([0,1,2,3,4,5], N, p=[0.4,0.2,0.15,0.1,0.1,0.05])

noise = np.random.normal(0, 1.1, N)
raw = (0.045*age + 2.6*occupation_risk + 1.0*coverage_type
       + sum_insured/350000.0 + 1.6*prior_claims - 0.35*tenure_years + noise)

q1, q2 = np.quantile(raw, [0.55, 0.85])
risk_tier = np.where(raw <= q1, 0, np.where(raw <= q2, 1, 2))  # 0 Low,1 Medium,2 High

Xr = np.column_stack([age, occupation_risk, coverage_type, sum_insured/100000.0, prior_claims, tenure_years])
feat_names_r = ["age","occupation_risk","coverage_type","sum_insured_lakh","prior_claims","tenure_years"]

Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, risk_tier, test_size=0.2, random_state=42, stratify=risk_tier)
scaler_r = StandardScaler().fit(Xr_tr)
Xr_tr_s, Xr_te_s = scaler_r.transform(Xr_tr), scaler_r.transform(Xr_te)

risk_model = LogisticRegression(max_iter=2000)
risk_model.fit(Xr_tr_s, yr_tr)
yr_pred = risk_model.predict(Xr_te_s)
risk_acc = accuracy_score(yr_te, yr_pred)
risk_f1 = f1_score(yr_te, yr_pred, average="macro")
risk_cm = confusion_matrix(yr_te, yr_pred).tolist()
risk_report = classification_report(yr_te, yr_pred, target_names=["Low","Medium","High"])

risk_export = {
    "feature_order": feat_names_r,
    "scaler_mean": scaler_r.mean_.tolist(),
    "scaler_scale": scaler_r.scale_.tolist(),
    "classes": ["Low","Medium","High"],
    "coef": risk_model.coef_.tolist(),
    "intercept": risk_model.intercept_.tolist(),
    "metrics": {"accuracy": round(risk_acc,4), "macro_f1": round(risk_f1,4), "confusion_matrix": risk_cm,
                "n_train": len(yr_tr), "n_test": len(yr_te)}
}
with open(f"{OUT}/risk_model.json","w") as f: json.dump(risk_export, f, indent=2)

# =====================================================================
# 2. FRAUD DETECTION MODEL (binary: claim is fraudulent)
# =====================================================================
M = 3000
claim_sum_insured = np.random.choice([200000,300000,500000,750000,1000000,1500000], M)
claim_amount = np.random.uniform(0.05, 1.05, M) * claim_sum_insured
ratio = (claim_amount / claim_sum_insured).clip(0,1.2)
days_since_policy_start = np.random.exponential(180, M).clip(0, 1500).astype(int)
days_to_file = np.random.exponential(10, M).clip(0, 200).astype(int)
prior_claims_12m = np.random.poisson(0.25, M).clip(0,4)
claim_type_risk = np.random.choice([0,1,2], M, p=[0.5,0.35,0.15])  # Medical/Disability/Death
is_near_policy_end = (np.random.uniform(0,365,M) < 30).astype(int)

noise_f = np.random.normal(0, 1.0, M)
raw_f = (2.1*(ratio>0.85).astype(int) + 2.3*(days_since_policy_start<30).astype(int)
         + 1.1*(days_to_file>60).astype(int) + 0.9*prior_claims_12m
         + 0.55*claim_type_risk + 1.3*is_near_policy_end - 3.6 + noise_f)
prob_fraud = 1/(1+np.exp(-raw_f))
is_fraud = (np.random.uniform(0,1,M) < prob_fraud).astype(int)

Xf = np.column_stack([ratio, days_since_policy_start, days_to_file, prior_claims_12m, claim_type_risk, is_near_policy_end])
feat_names_f = ["claim_to_sum_insured_ratio","days_since_policy_start","days_to_file","prior_claims_12m","claim_type_risk","is_near_policy_end"]

Xf_tr, Xf_te, yf_tr, yf_te = train_test_split(Xf, is_fraud, test_size=0.2, random_state=42, stratify=is_fraud)
scaler_f = StandardScaler().fit(Xf_tr)
Xf_tr_s, Xf_te_s = scaler_f.transform(Xf_tr), scaler_f.transform(Xf_te)

fraud_model = LogisticRegression(max_iter=2000, class_weight="balanced")
fraud_model.fit(Xf_tr_s, yf_tr)
yf_pred = fraud_model.predict(Xf_te_s)
fraud_acc = accuracy_score(yf_te, yf_pred)
fraud_f1 = f1_score(yf_te, yf_pred)
fraud_cm = confusion_matrix(yf_te, yf_pred).tolist()
fraud_report = classification_report(yf_te, yf_pred, target_names=["Legit","Fraud"])

fraud_export = {
    "feature_order": feat_names_f,
    "scaler_mean": scaler_f.mean_.tolist(),
    "scaler_scale": scaler_f.scale_.tolist(),
    "coef": fraud_model.coef_[0].tolist(),
    "intercept": float(fraud_model.intercept_[0]),
    "metrics": {"accuracy": round(fraud_acc,4), "f1": round(fraud_f1,4), "confusion_matrix": fraud_cm,
                "fraud_rate_in_data": round(float(is_fraud.mean()),4),
                "n_train": len(yf_tr), "n_test": len(yf_te)}
}
with open(f"{OUT}/fraud_model.json","w") as f: json.dump(fraud_export, f, indent=2)

with open(f"{OUT}/MODEL_METRICS.md","w") as f:
    f.write("# ML Model Training Report\n\n")
    f.write("## 1. Risk / Underwriting Tier Model (Multinomial Logistic Regression)\n\n")
    f.write(f"- Training samples: {len(yr_tr)}, Test samples: {len(yr_te)}\n")
    f.write(f"- Test Accuracy: **{risk_acc:.2%}**, Macro F1: **{risk_f1:.4f}**\n\n")
    f.write("Confusion matrix (rows=actual, cols=predicted) [Low, Medium, High]:\n\n```\n")
    f.write(str(np.array(risk_cm))+"\n```\n\n")
    f.write("```\n"+risk_report+"\n```\n\n")
    f.write("## 2. Claims Fraud Detection Model (Logistic Regression, class-balanced)\n\n")
    f.write(f"- Training samples: {len(yf_tr)}, Test samples: {len(yf_te)}\n")
    f.write(f"- Fraud rate in synthetic data: {is_fraud.mean():.2%}\n")
    f.write(f"- Test Accuracy: **{fraud_acc:.2%}**, F1 (fraud class): **{fraud_f1:.4f}**\n\n")
    f.write("Confusion matrix (rows=actual, cols=predicted) [Legit, Fraud]:\n\n```\n")
    f.write(str(np.array(fraud_cm))+"\n```\n\n")
    f.write("```\n"+fraud_report+"\n```\n")

print("DONE")
print("Risk acc:", risk_acc, "Fraud acc:", fraud_acc)
