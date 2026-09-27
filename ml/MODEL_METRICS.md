# ML Model Training Report

## 1. Risk / Underwriting Tier Model (Multinomial Logistic Regression)

- Training samples: 3200, Test samples: 800
- Test Accuracy: **81.75%**, Macro F1: **0.7913**

Confusion matrix (rows=actual, cols=predicted) [Low, Medium, High]:

```
[[395  45   0]
 [ 51 167  22]
 [  0  28  92]]
```

```
              precision    recall  f1-score   support

         Low       0.89      0.90      0.89       440
      Medium       0.70      0.70      0.70       240
        High       0.81      0.77      0.79       120

    accuracy                           0.82       800
   macro avg       0.80      0.79      0.79       800
weighted avg       0.82      0.82      0.82       800

```

## 2. Claims Fraud Detection Model (Logistic Regression, class-balanced)

- Training samples: 2400, Test samples: 600
- Fraud rate in synthetic data: 19.10%
- Test Accuracy: **67.67%**, F1 (fraud class): **0.4425**

Confusion matrix (rows=actual, cols=predicted) [Legit, Fraud]:

```
[[329 156]
 [ 38  77]]
```

```
              precision    recall  f1-score   support

       Legit       0.90      0.68      0.77       485
       Fraud       0.33      0.67      0.44       115

    accuracy                           0.68       600
   macro avg       0.61      0.67      0.61       600
weighted avg       0.79      0.68      0.71       600

```
