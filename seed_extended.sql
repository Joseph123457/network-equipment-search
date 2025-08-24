-- 기존 장비 데이터 업데이트 (가격, 출시일, 인기도 등)
UPDATE equipment SET 
  min_price = 1000000, 
  max_price = 3000000, 
  release_date = '2023-03-15', 
  popularity_score = 85,
  view_count = 1250
WHERE id = 1; -- Cisco ASA 5506-X

UPDATE equipment SET 
  min_price = 2000000, 
  max_price = 5000000, 
  release_date = '2023-06-20', 
  popularity_score = 92,
  view_count = 1580
WHERE id = 2; -- Fortinet FortiGate 60F

UPDATE equipment SET 
  min_price = 5000000, 
  max_price = 8000000, 
  release_date = '2023-01-10', 
  popularity_score = 78,
  view_count = 980
WHERE id = 3; -- Palo Alto PA-220

UPDATE equipment SET 
  min_price = 1500000, 
  max_price = 3000000, 
  release_date = '2022-11-05', 
  popularity_score = 88,
  view_count = 2100
WHERE id = 4; -- Cisco Catalyst 2960-X

UPDATE equipment SET 
  min_price = 3000000, 
  max_price = 10000000, 
  release_date = '2023-02-28', 
  popularity_score = 75,
  view_count = 1450
WHERE id = 5; -- HP ProLiant DL380 Gen10

-- 상세 스펙 데이터 추가
-- Cisco ASA 5506-X 스펙
INSERT INTO equipment_specs (equipment_id, spec_name, spec_value, spec_unit, is_comparable, display_order) VALUES
(1, 'Throughput', '750', 'Mbps', 1, 1),
(1, 'VPN Throughput', '100', 'Mbps', 1, 2),
(1, 'Concurrent Sessions', '50000', '', 1, 3),
(1, 'Interfaces', '8', 'GE', 1, 4),
(1, 'Memory', '4', 'GB', 1, 5),
(1, 'Storage', '8', 'GB', 1, 6),
(1, 'Power Consumption', '45', 'W', 1, 7),
(1, 'Rack Size', '1', 'U', 1, 8);

-- Fortinet FortiGate 60F 스펙
INSERT INTO equipment_specs (equipment_id, spec_name, spec_value, spec_unit, is_comparable, display_order) VALUES
(2, 'Throughput', '10000', 'Mbps', 1, 1),
(2, 'IPS Throughput', '550', 'Mbps', 1, 2),
(2, 'VPN Throughput', '1800', 'Mbps', 1, 3),
(2, 'Concurrent Sessions', '200000', '', 1, 4),
(2, 'Interfaces', '15', 'GE', 1, 5),
(2, 'Memory', '4', 'GB', 1, 6),
(2, 'Storage', '128', 'GB', 1, 7),
(2, 'Power Consumption', '60', 'W', 1, 8),
(2, 'Rack Size', '1', 'U', 1, 9);

-- Palo Alto PA-220 스펙
INSERT INTO equipment_specs (equipment_id, spec_name, spec_value, spec_unit, is_comparable, display_order) VALUES
(3, 'Throughput', '940', 'Mbps', 1, 1),
(3, 'App Throughput', '100', 'Mbps', 1, 2),
(3, 'IPS Throughput', '100', 'Mbps', 1, 3),
(3, 'VPN Throughput', '50', 'Mbps', 1, 4),
(3, 'Concurrent Sessions', '64000', '', 1, 5),
(3, 'Interfaces', '8', 'GE', 1, 6),
(3, 'Memory', '4', 'GB', 1, 7),
(3, 'Storage', '32', 'GB', 1, 8),
(3, 'Power Consumption', '55', 'W', 1, 9),
(3, 'Rack Size', '1', 'U', 1, 10);

-- Cisco Catalyst 2960-X 스펙
INSERT INTO equipment_specs (equipment_id, spec_name, spec_value, spec_unit, is_comparable, display_order) VALUES
(4, 'Port Count', '24', '', 1, 1),
(4, 'Port Speed', '1000', 'Mbps', 1, 2),
(4, 'Uplink Ports', '4', 'SFP+', 1, 3),
(4, 'Switching Capacity', '216', 'Gbps', 1, 4),
(4, 'Forwarding Rate', '131', 'Mpps', 1, 5),
(4, 'MAC Table', '8192', '', 1, 6),
(4, 'Power Consumption', '370', 'W', 1, 7),
(4, 'Rack Size', '1', 'U', 1, 8),
(4, 'PoE Budget', '370', 'W', 1, 9);

-- HP ProLiant DL380 Gen10 스펙
INSERT INTO equipment_specs (equipment_id, spec_name, spec_value, spec_unit, is_comparable, display_order) VALUES
(5, 'CPU Sockets', '2', '', 1, 1),
(5, 'Max Memory', '3000', 'GB', 1, 2),
(5, 'Storage Bays', '30', 'SFF', 1, 3),
(5, 'Network Ports', '4', 'GbE', 1, 4),
(5, 'Power Supply', '800', 'W', 1, 5),
(5, 'Rack Size', '2', 'U', 1, 6),
(5, 'PCIe Slots', '8', '', 1, 7),
(5, 'Max Storage', '76.8', 'TB', 1, 8);

-- 추가 장비 데이터 (더 많은 비교 옵션을 위해)
INSERT INTO equipment (name, category, brand, model, description, image_url, specifications, certifications, price_range, tags, min_price, max_price, release_date, popularity_score, view_count) VALUES 
(
  'SonicWall TZ470',
  '보안',
  'SonicWall',
  'TZ470',
  'SonicWall TZ470은 소중형 사무실을 위한 통합 위협 관리 방화벽입니다.',
  '/static/images/sonicwall-tz470.jpg',
  '{"throughput": "1.5 Gbps", "ips_throughput": "300 Mbps", "vpn_throughput": "200 Mbps", "concurrent_sessions": "25000", "interfaces": "7x GE", "memory": "2 GB", "storage": "64 GB"}',
  '{"fips": "FIPS 140-2", "cc": "CC EAL4"}',
  '80만원-200만원',
  '방화벽,소닉월,UTM,보안장비,중소기업',
  800000,
  2000000,
  '2023-04-12',
  82,
  950
),
(
  'Juniper EX2300-24T',
  '네트워크',
  'Juniper',
  'EX2300-24T',
  'Juniper EX2300-24T는 엔터프라이즈급 액세스 스위치입니다.',
  '/static/images/juniper-ex2300.jpg',
  '{"ports": "24x 10/100/1000", "uplink": "4x SFP/SFP+", "switching_capacity": "128 Gbps", "forwarding_rate": "95.2 Mpps", "mac_table": "16000", "power": "150W"}',
  '{"energy_star": "Energy Star", "rohs": "RoHS"}',
  '200만원-400만원',
  '스위치,주니퍼,네트워크장비,엔터프라이즈,액세스스위치',
  2000000,
  4000000,
  '2023-05-18',
  73,
  720
),
(
  'Dell PowerEdge R640',
  '서버',
  'Dell',
  'R640',
  'Dell PowerEdge R640은 고성능 1U 랙 서버로 가상화에 최적화되어 있습니다.',
  '/static/images/dell-r640.jpg',
  '{"cpu": "Intel Xeon Scalable", "memory": "최대 1TB DDR4", "storage": "최대 10개 SFF 드라이브", "network": "4x 1GbE", "power": "2x 495W", "form_factor": "1U"}',
  '{"energy_star": "Energy Star", "epeat": "EPEAT Silver"}',
  '250만원-800만원',
  '서버,델,파워엣지,랙서버,가상화,1U',
  2500000,
  8000000,
  '2023-07-22',
  79,
  1340
);