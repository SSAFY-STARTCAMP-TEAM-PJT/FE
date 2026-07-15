export const locations = [
  { contentId:'126508', name:'해운대 해수욕장', shortName:'해운대', category:'ATTRACTION', categoryLabel:'관광지', address:'부산광역시 해운대구 해운대해변로 264', latitude:35.158698, longitude:129.160384, description:'부산을 대표하는 해수욕장입니다.' },
  { contentId:'126509', name:'동백섬', shortName:'동백섬', category:'ATTRACTION', categoryLabel:'관광지', address:'부산광역시 해운대구 우동', latitude:35.153215, longitude:129.1527, description:'해안 산책로와 누리마루가 있는 여행지입니다.' },
  { contentId:'126510', name:'광안리 해수욕장', shortName:'광안리', category:'ATTRACTION', categoryLabel:'관광지', address:'부산광역시 수영구 광안해변로 219', latitude:35.153169, longitude:129.118666, description:'광안대교 야경으로 유명한 해변입니다.' },
  { contentId:'126511', name:'해운대 전통시장', shortName:'전통시장', category:'RESTAURANT', categoryLabel:'맛집', address:'부산광역시 해운대구 구남로41번길 22-1', latitude:35.161185, longitude:129.161089, description:'다양한 부산 먹거리를 즐길 수 있는 시장입니다.' },
  { contentId:'126512', name:'부산시립미술관', shortName:'시립미술관', category:'CULTURE', categoryLabel:'문화시설', address:'부산광역시 해운대구 APEC로 58', latitude:35.166781, longitude:129.137019, description:'현대미술 전시를 관람할 수 있는 문화시설입니다.' },
  { contentId:'126513', name:'달맞이길', shortName:'달맞이길', category:'ATTRACTION', categoryLabel:'관광지', address:'부산광역시 해운대구 달맞이길', latitude:35.158559, longitude:129.180944, description:'해안 풍경과 카페를 즐길 수 있는 드라이브 코스입니다.' },
]

export const mockPost = {
  id: 12,
  category: 'COURSE',
  categoryLabel: '여행 코스',
  title: '부산 하루 여행 코스',
  content: '해운대부터 광안리까지 이동하는 하루 여행 코스입니다. 바다 풍경을 따라 산책하고 부산의 대표적인 해변을 둘러볼 수 있습니다.',
  createdAt: '2026-07-14T10:30:00',
  locations: [locations[0], locations[1], locations[2]],
}
