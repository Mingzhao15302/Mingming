export const dropdownFields = [
  {
    key: 'productType',
    label: '产品类型',
    options: ['', '灌装机', '自动线', '码垛机']
  },
  {
    key: 'fillingModel',
    label: '灌装机型号',
    options: ['', '30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T']
  },
  {
    key: 'capType',
    label: '桶盖',
    options: ['', '塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖']
  },
  {
    key: 'capacity',
    label: '容量',
    options: ['', '0.5~5L', '15~25L', '50L', '200L', '1000L']
  },
  {
    key: 'feed',
    label: '来料方式',
    options: ['', '直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制']
  },
  {
    key: 'explosionProof',
    label: '防爆要求',
    options: ['', '防爆', '不防爆']
  },
  {
    key: 'fillingHeads',
    label: '灌装方式',
    options: ['', '单头', '双头', '三头', '四头', '五头', '六头', '八头']
  },
  {
    key: 'lidPlacement',
    label: '放盖方式',
    options: ['', '单吸盘', '双吸盘', '小口桶自动落盖', '自动追踪放盖', '人工放盖']
  },
  {
    key: 'capping',
    label: '压盖方式',
    options: ['', '5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖']
  },
  {
    key: 'convey',
    label: '输送方式',
    options: ['', '滚筒', '板链', '步进']
  },
  {
    key: 'buffer',
    label: '缓存方式',
    options: ['', '不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送']
  },
  {
    key: 'voc',
    label: 'VOC要求',
    options: ['', '一体式集气', '灌装阀集气']
  },
  {
    key: 'autoLine',
    label: '灌装自动线',
    options: [
      '',
      '1~5L方桶灌装自动线',
      '1~5L圆桶灌装自动线',
      '15~25L铁桶灌装自动线',
      '15~25L塑料桶灌装自动线',
      '15~25L偏心口桶灌装自动线',
      '50~200L桶灌装自动线',
      'IBC桶灌装自动线',
      '袋式灌装线'
    ]
  },
  {
    key: 'barrelSplit',
    label: '分桶方式',
    options: ['', '卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶']
  },
  {
    key: 'cappingGuide',
    label: '理盖方式',
    options: ['', '自动补盖', '转盘式理盖', '振动盘理盖']
  },
  {
    key: 'barrelPosition',
    label: '转桶定位',
    options: ['', '滚轮', '八爪鱼', '平板压', '旋压式', '200L滚轮']
  },
  {
    key: 'palletizing',
    label: '码垛方式',
    options: ['', '机器人码垛', '悬臂式码垛', '龙门式码垛', '双工位机器人码垛', '双工位悬臂式码垛', '双工位龙门码垛']
  }
];

export const multiChoiceFields = [
  {
    key: 'weighing',
    label: '检重方式',
    options: ['动态检重', '静态检重', '检重剔除']
  },
  {
    key: 'labeling',
    label: '贴标方式',
    options: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标']
  },
  {
    key: 'pallet',
    label: '托盘方式',
    options: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送']
  },
  {
    key: 'boxing',
    label: '装箱方式',
    options: ['自动开箱', '自动装箱', '自动封箱', '自动码箱']
  },
  {
    key: 'extras',
    label: '其他功能',
    options: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶']
  }
];
