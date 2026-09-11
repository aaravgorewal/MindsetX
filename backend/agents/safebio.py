"""
SafeBio Agent - Manages biometric data and consent
Ensures privacy and ethical data handling
"""


class SafeBioAgent:
    """Agent that manages biometric data safely"""
    
    def __init__(self):
        """Initialize SafeBio agent"""
        self.name = "SafeBio"
    
    def validate_consent(self, consent_flag: bool):
        """Validate user consent for biometric data"""
        if not consent_flag:
            raise Exception("Consent not granted")
    
    def analyze_bio_data(self, bio_metadata: dict) -> str:
        """Analyze biometric data and assess risk"""
        risk_score = 0.0

        if bio_metadata.get("cholesterol", 0) > 200:
            risk_score += 0.3

        if bio_metadata.get("genetic_risk", False):
            risk_score += 0.4

        if risk_score > 0.6:
            return "high_bio_risk"
        elif risk_score > 0.3:
            return "moderate_bio_risk"
        else:
            return "low_bio_risk"
