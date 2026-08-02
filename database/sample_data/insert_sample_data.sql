-- ============================================================================
-- Seeding script for IdentyBridge demo data mapping to Supabase/PostgreSQL schema
-- All records are fictional and intended solely for demo and testing purposes.
-- ============================================================================

-- 1. Insert Fictional Missing Reports (reporter_type = 'family' or 'police')
INSERT INTO missing_reports (id, reporter_type, contact_info, extracted_data, image_url, embedding, created_at, status)
VALUES
  -- F001: Rahul Kumar (Family Report)
  (
    'f0000000-0000-0000-0000-000000000001',
    'family',
    '+91-98765-43210',
    '{
      "reporter_name": "Amit Kumar",
      "missing_person_name": "Rahul Kumar",
      "age_approx": 24,
      "gender": "Male",
      "height": "175 cm",
      "clothing": "Blue crewneck t-shirt, beige cargo shorts, and white sneakers",
      "location_missing": "Kukatpally, near Metro Station",
      "last_seen_time": "2026-08-01T18:30:00Z",
      "physical_marks": "Small black mole on left cheek, steel watch on right wrist"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T18:30:00Z',
    'active'
  ),
  -- F002: Sunitha Rao (Family Report)
  (
    'f0000000-0000-0000-0000-000000000002',
    'family',
    '+91-99887-76655',
    '{
      "reporter_name": "Gopal Rao",
      "missing_person_name": "Sunitha Rao",
      "age_approx": 62,
      "gender": "Female",
      "height": "152 cm",
      "clothing": "Green cotton saree with a red border, gold bangles",
      "location_missing": "Begumpet, near Metro Station",
      "last_seen_time": "2026-08-01T10:00:00Z",
      "physical_marks": "Speaks only Telugu, wearing green-and-gold bangles, surgical scar on right knee"
    }'::jsonb,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T10:00:00Z',
    'active'
  ),
  -- F003: Vikram Reddy (Family Report)
  (
    'f0000000-0000-0000-0000-000000000003',
    'family',
    '+91-94401-23456',
    '{
      "reporter_name": "Kavitha Reddy",
      "missing_person_name": "Vikram Reddy",
      "age_approx": 35,
      "gender": "Male",
      "height": "180 cm",
      "clothing": "Black polo t-shirt, grey jeans, sports shoes",
      "location_missing": "Dilsukhnagar, near Sai Baba Temple",
      "last_seen_time": "2026-07-31T20:00:00Z",
      "physical_marks": "Tattoo of a dragon on left bicep, scar on left eyebrow"
    }'::jsonb,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T20:00:00Z',
    'active'
  ),
  -- F004: Ananya Sen (Family Report)
  (
    'f0000000-0000-0000-0000-000000000004',
    'family',
    '+91-91234-56789',
    '{
      "reporter_name": "Sourav Sen",
      "missing_person_name": "Ananya Sen",
      "age_approx": 21,
      "gender": "Female",
      "height": "160 cm",
      "clothing": "Yellow kurta, white leggings, carrying a brown jute bag",
      "location_missing": "Secunderabad, near Railway Station",
      "last_seen_time": "2026-08-01T15:30:00Z",
      "physical_marks": "Silver nose ring on left side, small star tattoo on right wrist"
    }'::jsonb,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T15:30:00Z',
    'active'
  ),
  -- F005: Mohammad Rizwan (Family Report)
  (
    'f0000000-0000-0000-0000-000000000005',
    'family',
    '+91-93921-98765',
    '{
      "reporter_name": "Yasmin Begum",
      "missing_person_name": "Mohammad Rizwan",
      "age_approx": 29,
      "gender": "Male",
      "height": "172 cm",
      "clothing": "Green checked shirt, black jeans, grey running shoes",
      "location_missing": "LB Nagar, near Ring Road Junction",
      "last_seen_time": "2026-08-01T21:00:00Z",
      "physical_marks": "Deep scar on left knee, black threads around right ankle"
    }'::jsonb,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T21:00:00Z',
    'active'
  ),
  -- F006: Sai Kiran (Family Report)
  (
    'f0000000-0000-0000-0000-000000000006',
    'family',
    '+91-95505-12345',
    '{
      "reporter_name": "Ramesh Reddy",
      "missing_person_name": "Sai Kiran",
      "age_approx": 19,
      "gender": "Male",
      "height": "168 cm",
      "clothing": "White t-shirt with ''Nike'' logo, orange sports shorts",
      "location_missing": "Miyapur, near Talkie Town",
      "last_seen_time": "2026-07-31T17:00:00Z",
      "physical_marks": "Slight limp in walking, birthmark on neck"
    }'::jsonb,
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T17:00:00Z',
    'active'
  ),
  -- F007: Lakshmi Prasad (Family Report)
  (
    'f0000000-0000-0000-0000-000000000007',
    'family',
    '+91-98660-45678',
    '{
      "reporter_name": "Satish Prasad",
      "missing_person_name": "Lakshmi Prasad",
      "age_approx": 72,
      "gender": "Female",
      "height": "148 cm",
      "clothing": "Blue cotton saree, steel bangles",
      "location_missing": "Dilsukhnagar, bus shelter",
      "last_seen_time": "2026-08-02T07:30:00Z",
      "physical_marks": "Dementia patient, speaks Hindi and Telugu, silver ring on right hand ring finger"
    }'::jsonb,
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-02T07:30:00Z',
    'active'
  ),
  -- F008: Priya Sharma (Family Report)
  (
    'f0000000-0000-0000-0000-000000000008',
    'family',
    '+91-90001-90002',
    '{
      "reporter_name": "Rahul Sharma",
      "missing_person_name": "Priya Sharma",
      "age_approx": 26,
      "gender": "Female",
      "height": "165 cm",
      "clothing": "Red sleeveless dress, brown flat shoes",
      "location_missing": "Begumpet, near Lifestyle Store",
      "last_seen_time": "2026-08-01T22:00:00Z",
      "physical_marks": "Tattoo of an anchor on left wrist"
    }'::jsonb,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T22:00:00Z',
    'active'
  ),
  -- F009: Rajesh Verma (Family Report)
  (
    'f0000000-0000-0000-0000-000000000009',
    'family',
    '+91-98480-22334',
    '{
      "reporter_name": "Suresh Verma",
      "missing_person_name": "Rajesh Verma",
      "age_approx": 45,
      "gender": "Male",
      "height": "178 cm",
      "clothing": "White check shirt, dark trousers",
      "location_missing": "LB Nagar, near Ring Road",
      "last_seen_time": "2026-07-30T10:00:00Z",
      "physical_marks": "Limp in left leg, wears prescription glasses"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-30T10:00:00Z',
    'active'
  ),
  -- F010: Arjun Rao (Family Report)
  (
    'f0000000-0000-0000-0000-000000000010',
    'family',
    '+91-91122-33445',
    '{
      "reporter_name": "Sujatha Rao",
      "missing_person_name": "Arjun Rao",
      "age_approx": 12,
      "gender": "Male",
      "height": "135 cm",
      "clothing": "Red school uniform shirt, navy blue shorts",
      "location_missing": "Kukatpally, near KPHB Road",
      "last_seen_time": "2026-08-01T16:00:00Z",
      "physical_marks": "Scar on right elbow"
    }'::jsonb,
    'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T16:00:00Z',
    'active'
  ),

  -- P001: Kukatpally Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000001',
    'police',
    '+91-40-23201222',
    '{
      "officer_name": "Sub-Inspector K. Suresh",
      "station_name": "Kukatpally Police Station",
      "accident_location": "Kukatpally Y Junction, Hyderabad",
      "accident_time": "2026-08-01T19:15:00Z",
      "age_approx": 25,
      "gender": "Male",
      "height": "174 cm",
      "clothing": "Blue crewneck t-shirt, beige shorts",
      "visible_injuries": "Laceration on forehead, scraped elbows",
      "vehicle_type": "Pedestrian (hit-and-run by auto-rickshaw)",
      "personal_belongings": "Steel wrist watch, wallet without cash/ID"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T19:15:00Z',
    'active'
  ),
  -- P002: Begumpet Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000002',
    'police',
    '+91-40-27853500',
    '{
      "officer_name": "Inspector M. Srinivasa Rao",
      "station_name": "Begumpet Police Station",
      "accident_location": "Begumpet Flyover, Hyderabad",
      "accident_time": "2026-08-01T11:30:00Z",
      "age_approx": 65,
      "gender": "Female",
      "height": "150 cm",
      "clothing": "Green saree with red borders",
      "visible_injuries": "Fracture on right wrist, minor facial bruises",
      "vehicle_type": "Pedestrian",
      "personal_belongings": "Gold-plated bangles, cloth purse with no identity cards"
    }'::jsonb,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T11:30:00Z',
    'active'
  ),
  -- P003: Dilsukhnagar Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000003',
    'police',
    '+91-40-24036611',
    '{
      "officer_name": "SI G. Rajender",
      "station_name": "Dilsukhnagar Police Station",
      "accident_location": "Dilsukhnagar Metro Pillar 1510, Hyderabad",
      "accident_time": "2026-07-31T20:45:00Z",
      "age_approx": 35,
      "gender": "Male",
      "height": "181 cm",
      "clothing": "Black collared shirt, grey denim pants",
      "visible_injuries": "Laceration above left eye, fractured collarbone",
      "vehicle_type": "Motorcycle (skidded)",
      "personal_belongings": "Black helmet, leather wallet with no cash/cards, motorcycle key"
    }'::jsonb,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T20:45:00Z',
    'active'
  ),
  -- P004: Secunderabad Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000004',
    'police',
    '+91-40-27854611',
    '{
      "officer_name": "SI V. Janardhan",
      "station_name": "Secunderabad Gopalapuram PS",
      "accident_location": "Secunderabad Station Road, near Gurudwara, Hyderabad",
      "accident_time": "2026-08-01T16:10:00Z",
      "age_approx": 22,
      "gender": "Female",
      "height": "159 cm",
      "clothing": "Yellow top, white leggings",
      "visible_injuries": "Abrasions on hands, head trauma",
      "vehicle_type": "Pedestrian (hit by two-wheeler)",
      "personal_belongings": "Silver nose ring, brown jute bag containing a book and lunch box"
    }'::jsonb,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T16:10:00Z',
    'active'
  ),
  -- P005: LB Nagar Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000005',
    'police',
    '+91-40-24036322',
    '{
      "officer_name": "Inspector B. Anjaneyulu",
      "station_name": "LB Nagar Police Station",
      "accident_location": "LB Nagar Flyover Underpass, Hyderabad",
      "accident_time": "2026-08-01T21:40:00Z",
      "age_approx": 30,
      "gender": "Male",
      "height": "173 cm",
      "clothing": "Green checked shirt, dark jeans",
      "visible_injuries": "Fracture in left knee/leg, cuts on face",
      "vehicle_type": "Pedestrian",
      "personal_belongings": "Black thread around right ankle, cash-less wallet"
    }'::jsonb,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T21:40:00Z',
    'active'
  ),
  -- P006: Miyapur Accident (Police Report)
  (
    'p0000000-0000-0000-0000-000000000006',
    'police',
    '+91-40-27852433',
    '{
      "officer_name": "SI K. Mahesh",
      "station_name": "Miyapur Police Station",
      "accident_location": "Miyapur Cross Roads, Hyderabad",
      "accident_time": "2026-07-31T17:45:00Z",
      "age_approx": 18,
      "gender": "Male",
      "height": "167 cm",
      "clothing": "White graphic t-shirt, orange shorts",
      "visible_injuries": "Bruised shoulder, scraped knees",
      "vehicle_type": "Bicycle vs Car",
      "personal_belongings": "Sports watch, broken spectacles"
    }'::jsonb,
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T17:45:00Z',
    'active'
  ),
  -- P007: Dilsukhnagar Accident 2 (Police Report)
  (
    'p0000000-0000-0000-0000-000000000007',
    'police',
    '+91-40-24036612',
    '{
      "officer_name": "SI D. Srinivas",
      "station_name": "Chaitanyapuri Police Station",
      "accident_location": "Dilsukhnagar Main Road, near Metro station, Hyderabad",
      "accident_time": "2026-08-02T08:15:00Z",
      "age_approx": 70,
      "gender": "Female",
      "height": "147 cm",
      "clothing": "Blue saree",
      "visible_injuries": "Superficial scratches on arms",
      "vehicle_type": "Pedestrian",
      "personal_belongings": "Silver ring on right hand, steel bangles"
    }'::jsonb,
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-02T08:15:00Z',
    'active'
  ),
  -- P008: Begumpet Accident 2 (Police Report)
  (
    'p0000000-0000-0000-0000-000000000008',
    'police',
    '+91-40-27853500',
    '{
      "officer_name": "SI P. Venkat",
      "station_name": "Begumpet Police Station",
      "accident_location": "Begumpet Road, near Prakash Nagar, Hyderabad",
      "accident_time": "2026-08-01T22:30:00Z",
      "age_approx": 30,
      "gender": "Female",
      "height": "162 cm",
      "clothing": "Dark orange/red dress",
      "visible_injuries": "Laceration on right shoulder, head trauma",
      "vehicle_type": "Pedestrian",
      "personal_belongings": "None"
    }'::jsonb,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T22:30:00Z',
    'active'
  ),
  -- P009: LB Nagar Accident 2 (Police Report)
  (
    'p0000000-0000-0000-0000-000000000009',
    'police',
    '+91-40-24036322',
    '{
      "officer_name": "SI M. Kumar",
      "station_name": "LB Nagar PS",
      "accident_location": "LB Nagar crossroads, Hyderabad",
      "accident_time": "2026-07-30T18:00:00Z",
      "age_approx": 50,
      "gender": "Male",
      "height": "175 cm",
      "clothing": "Greyish collared shirt, black trousers",
      "visible_injuries": "Multiple abrasions, fractured ankle",
      "vehicle_type": "Pedestrian (hit-and-run)",
      "personal_belongings": "Broken glasses found nearby"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-30T18:00:00Z',
    'active'
  ),
  -- P010: Miyapur Accident 2 (Police Report)
  (
    'p0000000-0000-0000-0000-000000000010',
    'police',
    '+91-40-27852433',
    '{
      "officer_name": "SI T. Rama Rao",
      "station_name": "Miyapur PS",
      "accident_location": "Miyapur Cross Roads, Hyderabad",
      "accident_time": "2026-08-02T11:00:00Z",
      "age_approx": 45,
      "gender": "Male",
      "height": "170 cm",
      "clothing": "Blue jeans, black t-shirt",
      "visible_injuries": "Head trauma",
      "vehicle_type": "Pedestrian",
      "personal_belongings": "Wrist watch"
    }'::jsonb,
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-02T11:00:00Z',
    'active'
  );


-- 2. Insert Fictional Unidentified Patients
INSERT INTO unidentified_patients (id, hospital_name, extracted_data, image_url, embedding, created_at, status)
VALUES
  -- H001: Rahul Kumar (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000001',
    'NIMS Hospital, Panjagutta',
    '{
      "admission_time": "2026-08-01T20:00:00Z",
      "age_estimate": 23,
      "gender": "Male",
      "height": "175 cm",
      "clothing": "Blue crewneck t-shirt (cut during triage), beige shorts",
      "injuries": "Head trauma, laceration on forehead, right leg fracture",
      "patient_condition": "Unconscious, Stable",
      "ward_number": "ICU Ward 3, Bed 12"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T20:00:00Z',
    'active'
  ),
  -- H002: Sunitha Rao (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000002',
    'Yashoda Hospital, Somajiguda',
    '{
      "admission_time": "2026-08-01T12:15:00Z",
      "age_estimate": 60,
      "gender": "Female",
      "height": "152 cm",
      "clothing": "Green cotton saree, red blouse",
      "injuries": "Right wrist fracture, minor concussion",
      "patient_condition": "Disoriented, unable to speak clearly, stable",
      "ward_number": "General Ward 5, Bed 3"
    }'::jsonb,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T12:15:00Z',
    'active'
  ),
  -- H003: Vikram Reddy (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000003',
    'Osmania General Hospital',
    '{
      "admission_time": "2026-07-31T21:30:00Z",
      "age_estimate": 36,
      "gender": "Male",
      "height": "180 cm",
      "clothing": "Black polo shirt, grey jeans",
      "injuries": "Concussion, dislocated shoulder, left eyebrow laceration",
      "patient_condition": "Semi-conscious, confused",
      "ward_number": "Special Ward A, Bed 4"
    }'::jsonb,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T21:30:00Z',
    'active'
  ),
  -- H004: Ananya Sen (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000004',
    'Gandhi Hospital',
    '{
      "admission_time": "2026-08-01T17:00:00Z",
      "age_estimate": 20,
      "gender": "Female",
      "height": "160 cm",
      "clothing": "Yellow cotton kurta, white pants",
      "injuries": "Minor head injury, scrapes on hands and forearms",
      "patient_condition": "Unconscious, stable",
      "ward_number": "Emergency Ward 2, Bed 8"
    }'::jsonb,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T17:00:00Z',
    'active'
  ),
  -- H005: Mohammad Rizwan (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000005',
    'KIMS Hospital, Secunderabad',
    '{
      "admission_time": "2026-08-01T22:30:00Z",
      "age_estimate": 28,
      "gender": "Male",
      "height": "172 cm",
      "clothing": "Green checked shirt, black denim pants",
      "injuries": "Left leg tibial fracture, facial abrasions",
      "patient_condition": "Conscious but mute due to shock, stable",
      "ward_number": "Orthopedic Ward 1, Bed 15"
    }'::jsonb,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T22:30:00Z',
    'active'
  ),
  -- H006: Sai Kiran (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000006',
    'Medicover Hospitals, Madhapur',
    '{
      "admission_time": "2026-07-31T18:45:00Z",
      "age_estimate": 20,
      "gender": "Male",
      "height": "168 cm",
      "clothing": "White t-shirt, orange sports shorts",
      "injuries": "Scratches on knees, minor shoulder sprain",
      "patient_condition": "Conscious, memory loss regarding incident, stable",
      "ward_number": "General Ward 2, Bed 19"
    }'::jsonb,
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-31T18:45:00Z',
    'active'
  ),
  -- H007: Lakshmi Prasad (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000007',
    'Yashoda Hospitals, Malakpet',
    '{
      "admission_time": "2026-08-02T08:50:00Z",
      "age_estimate": 73,
      "gender": "Female",
      "height": "148 cm",
      "clothing": "Blue cotton saree",
      "injuries": "Dehydration, minor bruises on hands",
      "patient_condition": "Disoriented, speaks incoherently, stable",
      "ward_number": "Geriatric Ward C, Bed 2"
    }'::jsonb,
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-02T08:50:00Z',
    'active'
  ),
  -- H008: Priya Sharma (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000008',
    'NIMS Hospital, Panjagutta',
    '{
      "admission_time": "2026-08-01T23:15:00Z",
      "age_estimate": 28,
      "gender": "Female",
      "height": "164 cm",
      "clothing": "Red dress (soiled)",
      "injuries": "Concussion, shoulder laceration",
      "patient_condition": "Unconscious, stable",
      "ward_number": "ICU Ward 3, Bed 14"
    }'::jsonb,
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-01T23:15:00Z',
    'active'
  ),
  -- H009: Rajesh Verma (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000009',
    'Care Hospitals, Banjara Hills',
    '{
      "admission_time": "2026-07-30T19:30:00Z",
      "age_estimate": 48,
      "gender": "Male",
      "height": "178 cm",
      "clothing": "Soiled striped/check shirt, black pants",
      "injuries": "Fractured ankle, concussion",
      "patient_condition": "Conscious but confused, unable to speak clearly",
      "ward_number": "Special Care Ward B, Bed 1"
    }'::jsonb,
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-07-30T19:30:00Z',
    'active'
  ),
  -- H010: Arjun Rao (Unidentified Patient)
  (
    'h0000000-0000-0000-0000-000000000010',
    'Osmania General Hospital',
    '{
      "admission_time": "2026-08-02T12:00:00Z",
      "age_estimate": 50,
      "gender": "Male",
      "height": "172 cm",
      "clothing": "Black t-shirt, blue jeans",
      "injuries": "Fractured ribs, concussion",
      "patient_condition": "Unconscious",
      "ward_number": "ICU Bed 5"
    }'::jsonb,
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
    NULL,
    '2026-08-02T12:00:00Z',
    'active'
  );
