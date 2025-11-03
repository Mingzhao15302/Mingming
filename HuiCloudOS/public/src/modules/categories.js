export const CATEGORY_OPTIONS = {
  productType: ['灌装机', '自动线', '码垛机'],
  fillerModel: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'],
  bucketCap: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'],
  capacity: ['0.5~5L', '15~25L', '50L', '200L', '1000L'],
  feedMode: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'],
  explosionProof: ['防爆', '不防爆'],
  fillingHeads: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'],
  capFeeding: ['单吸盘', '双吸盘', '小口桶自动落盖', '自动追踪放盖', '人工放盖'],
  capPressing: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖'],
  conveying: ['滚筒', '板链', '步进'],
  buffering: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送'],
  voc: ['一体式集气', '灌装阀集气'],
  autoLine: [
    '1~5L方桶灌装自动线',
    '1~5L圆桶灌装自动线',
    '15~25L铁桶灌装自动线',
    '15~25L塑料桶灌装自动线',
    '15~25L偏心口桶灌装自动线',
    '50~200L桶灌装自动线',
    'IBC桶灌装自动线',
    '袋式灌装线'
  ],
  capping: ['自动补盖', '转盘式理盖', '振动盘理盖'],
  bucketSorting: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶'],
  palletizing: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '双工位机器人码垛', '双工位悬臂式码垛', '双工位龙门码垛']
};

export const MULTI_SELECT_FIELDS = {
  weighing: ['动态检重', '静态检重', '检重剔除'],
  labeling: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标'],
  pallet: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送'],
  boxing: ['自动开箱', '自动装箱', '自动封箱', '自动码箱'],
  others: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶']
};

export const FIELD_GROUPS = {
  灌装机: [
    'fillerModel',
    'bucketCap',
    'capacity',
    'feedMode',
    'explosionProof',
    'fillingHeads',
    'capFeeding',
    'capPressing',
    'conveying',
    'buffering',
    'voc'
  ],
  自动线: [
    'autoLine',
    'bucketCap',
    'capacity',
    'feedMode',
    'explosionProof',
    'bucketSorting',
    'fillingHeads',
    'capping',
    'capFeeding',
    'capPressing',
    'conveying',
    'buffering',
    'voc',
    'palletizing'
  ],
  码垛机: ['bucketCap', 'capacity', 'explosionProof', 'palletizing']
};

export const MULTI_GROUPS = {
  自动线: ['weighing', 'labeling', 'pallet', 'boxing', 'others']
};

export const FIELD_LABELS = {
  productType: '产品类型',
  fillerModel: '灌装机型号',
  bucketCap: '桶盖',
  capacity: '容量',
  feedMode: '来料方式',
  explosionProof: '防爆要求',
  fillingHeads: '灌装方式',
  capFeeding: '放盖方式',
  capPressing: '压盖方式',
  conveying: '输送方式',
  buffering: '缓存方式',
  voc: 'VOC要求',
  autoLine: '灌装自动线',
  capping: '理盖方式',
  bucketSorting: '分桶方式',
  palletizing: '码垛方式',
  weighing: '检重方式',
  labeling: '贴标方式',
  pallet: '托盘方式',
  boxing: '装箱方式',
  others: '其他功能'
};
