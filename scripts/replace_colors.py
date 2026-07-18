#!/usr/bin/env python3
"""Replace all emerald/teal/green Tailwind color references with blue equivalents."""
import re
import os

BASE = "/home/z/my-project/src/components/admin/sections"

replacements = [
    # emerald -> blue
    ("emerald-100", "blue-100"),
    ("emerald-200", "blue-200"),
    ("emerald-50", "blue-50"),
    ("emerald-600", "blue-600"),
    ("emerald-700", "blue-700"),
    ("emerald-800", "blue-800"),
    # teal -> blue
    ("teal-100", "blue-100"),
    ("teal-50", "blue-50"),
    ("teal-500", "blue-500"),
    ("teal-600", "blue-600"),
    ("teal-700", "blue-700"),
    ("teal-800", "blue-800"),
    # green -> blue
    ("green-100", "blue-100"),
    ("green-200", "blue-200"),
    ("green-50", "blue-50"),
    ("green-500", "blue-500"),
    ("green-600", "blue-600"),
    ("green-700", "blue-700"),
    ("green-800", "blue-800"),
]

files = [
    "PatientsSection.tsx",
    "ServicesSection.tsx",
    "CommissionSection.tsx",
    "DoctorsSection.tsx",
    "LoginPage.tsx",
    "DashboardSection.tsx",
    "BookingsSection.tsx",
    "PrescriptionsSection.tsx",
    "ChildCareSection.tsx",
    "CaregiversSection.tsx",
    "VerificationSection.tsx",
    "AnalyticsSection.tsx",
    "SubUsersSection.tsx",
    "ProfileSection.tsx",
    "ElderCareSection.tsx",
]

total_changes = 0
for fname in files:
    path = os.path.join(BASE, fname)
    with open(path, "r") as f:
        content = f.read()

    original = content
    for old, new in replacements:
        content = content.replace(old, new)

    file_changes = len(re.findall(r'(emerald|teal|green)-\d+', original))

    if content != original:
        with open(path, "w") as f:
            f.write(content)
        print(f"  {fname}: {file_changes} replacements made")
        total_changes += file_changes
    else:
        print(f"  {fname}: no changes needed")

print(f"\nTotal: {total_changes} color replacements across {len(files)} files")