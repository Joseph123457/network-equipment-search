-- 샘플 장비 데이터
INSERT OR IGNORE INTO equipment (name, category, brand, model, description, image_url, specifications, certifications, price_range, tags) VALUES 
(
  'Cisco ASA 5506-X',
  '보안',
  'Cisco',
  'ASA5506-X',
  'Cisco ASA 5506-X 차세대 방화벽은 중소기업을 위한 강력한 보안 솔루션입니다.',
  '/static/images/cisco-asa-5506x.jpg',
  '{"throughput": "750 Mbps", "vpn_throughput": "100 Mbps", "concurrent_sessions": "50000", "interfaces": "8x GE, 1x Console", "memory": "4 GB", "storage": "8 GB"}',
  '{"cc": "CC EAL4+", "fips": "FIPS 140-2 Level 2", "icsa": "ICSA Certified"}',
  '100만원-300만원',
  '방화벽,시스코,ASA,보안장비,중소기업,VPN'
),
(
  'Fortinet FortiGate 60F',
  '보안',
  'Fortinet',
  'FG-60F',
  'FortiGate 60F는 소규모 지점 및 중소기업을 위한 SD-WAN 및 보안 솔루션입니다.',
  '/static/images/fortigate-60f.jpg',
  '{"throughput": "10 Gbps", "ips_throughput": "550 Mbps", "vpn_throughput": "1.8 Gbps", "concurrent_sessions": "200000", "interfaces": "7x GE RJ45, 8x GE SFP", "memory": "4 GB", "storage": "128 GB"}',
  '{"cc": "CC EAL4", "fips": "FIPS 140-2", "icsa": "ICSA Labs"}',
  '200만원-500만원',
  '방화벽,포티넷,포티게이트,보안장비,SD-WAN,IPS'
),
(
  'Palo Alto PA-220',
  '보안',
  'Palo Alto',
  'PA-220',
  'PA-220은 소규모 지점을 위한 차세대 방화벽으로 완전한 보안 스택을 제공합니다.',
  '/static/images/paloalto-pa220.jpg',
  '{"throughput": "940 Mbps", "app_throughput": "100 Mbps", "ips_throughput": "100 Mbps", "vpn_throughput": "50 Mbps", "sessions": "64000", "interfaces": "8x GE"}',
  '{"cc": "CC EAL4", "fips": "FIPS 140-2 Level 2"}',
  '500만원-800만원',
  '방화벽,팔로알토,PA,차세대방화벽,NGFW,소규모'
),
(
  'Cisco Catalyst 2960-X',
  '네트워크',
  'Cisco',
  'WS-C2960X-24TS-L',
  'Cisco Catalyst 2960-X는 기업용 이더넷 스위치로 FlexStack-Plus 기술을 지원합니다.',
  '/static/images/cisco-2960x.jpg',
  '{"ports": "24x 10/100/1000", "uplink": "4x SFP+", "switching_capacity": "216 Gbps", "forwarding_rate": "131 Mpps", "mac_table": "8192", "power": "370W"}',
  '{"energy_star": "Energy Star", "rohs": "RoHS Compliant"}',
  '150만원-300만원',
  '스위치,시스코,카탈리스트,네트워크장비,이더넷,기업용'
),
(
  'HP ProLiant DL380 Gen10',
  '서버',
  'HPE',
  'DL380 Gen10',
  'HPE ProLiant DL380 Gen10은 업계 표준 2U 랙 서버로 다양한 워크로드를 지원합니다.',
  '/static/images/hp-dl380-gen10.jpg',
  '{"cpu": "Intel Xeon Scalable", "memory": "최대 3TB DDR4", "storage": "최대 30개 SFF 드라이브", "network": "4x 1GbE", "power": "2x 800W", "form_factor": "2U"}',
  '{"energy_star": "Energy Star", "epeat": "EPEAT Gold"}',
  '300만원-1000만원',
  '서버,HPE,프로라이언트,랙서버,엔터프라이즈'
);

-- 기본 관리자 계정 (비밀번호: admin123)
INSERT OR IGNORE INTO admin_users (username, password_hash, email) VALUES 
('admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin@webapp.com');