import os
import django
from datetime import date
from dateutil.relativedelta import relativedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.serializers import RegisterSerializer
from core.models import InternProfile

def verify():
    # 1. Test BTS calculation (30 months)
    data_bts = {
        'username': 'bts_verify_30',
        'password': 'password123',
        'first_name': 'Test',
        'last_name': 'BTS',
        'email': 'bts30@test.com',
        'role': 'INTERN',
        'major': 'IT',
        'start_date': date(2026, 4, 1),
        'internship_type': InternProfile.InternshipType.BTS
    }
    s = RegisterSerializer(data=data_bts)
    if s.is_valid():
        user = s.save()
        profile = user.intern_profile
        expected_end = date(2026, 4, 1) + relativedelta(months=30)
        print(f"BTS Test: Expected {expected_end}, Got {profile.end_date}")
        assert profile.end_date == expected_end
    else:
        print(f"BTS Test Failed Validation: {s.errors}")

    # 2. Test University limit (over 2 months should fail)
    data_uni_fail = {
        'username': 'uni_verify_fail',
        'password': 'password123',
        'first_name': 'Test',
        'last_name': 'Uni',
        'email': 'unifail@test.com',
        'role': 'INTERN',
        'major': 'CS',
        'start_date': date(2026, 4, 1),
        'end_date': date(2026, 7, 1),
        'internship_type': InternProfile.InternshipType.UNIVERSITY
    }
    s = RegisterSerializer(data=data_uni_fail)
    if s.is_valid():
        try:
            s.save()
            print("University Limit Test: FAILED (should have raised error)")
        except Exception as e:
            print(f"University Limit Test: PASSED (caught error: {e})")
    else:
        # Serializer validation should catch it if I put logic there
        print(f"University Limit Test: PASSED (validation caught error: {s.errors})")

if __name__ == "__main__":
    verify()
