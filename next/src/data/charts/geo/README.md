# china-provinces.json

- 来源: 阿里云 DataV.GeoAtlas `areas_v3/bound/100000_full.json` (底图数据来自天地图/国家地理信息公共服务平台), 取于 2026-11-22.
- 处理: mapshaper 0.6, `-simplify 12% keep-shapes weighted`, TopoJSON quantization 30000; 属性只留 name / adcode / cx,cy (质心).
- 包含 34 个省级行政区 (topology 对象 provinces). 南海诸岛九段线不参与简化, 以原始坐标 (保留两位小数) 存在顶层 `nine` 字段 (GeoJSON MultiPolygon). 发布含中国地图的产品时, 地图须完整 (含台湾、南海诸岛), 公开发布可能需要审图号, 请按当地要求处理.
- 约 33 KB, gzip 约 12 KB; ChinaMap 用动态 import 加载, 不进首屏包.
