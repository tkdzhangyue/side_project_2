export const Activity = {
  title: '公路车训练',
  activityTimeString: '',
  activityDate: new Date().getTime(),
  intensity: '适中',
  author: {
    nickName: 'big Boss!!',
    avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83epFyCELpVg2fGviaoicEQBNvcEMj6FoVzpJsoJ6ciafoF7JzaSqZHIyFV3fAg9IZaHacFkJXESRSmE7g/132',
    openid: 'oAW6-4nEYfkOaDDAobWjE7qW1wi0'
  },
  activityId: uuid(),
  groupMembers: [],
  points: []

}

export function uuid() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

