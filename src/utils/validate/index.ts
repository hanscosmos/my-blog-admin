const rules: any = {
  /** H6:英文**/
  isEnglish: {
    rule: /^[0-9a-zA-Z_]{1,}$/,
    msg: '必须为英文或数字字符或英文特殊字符！',
  },
  /** H6:密码验证**/
  isPassword: {
    rule: /^[a-zA-Z0-9\x21-\x7e]{6,}$/,
    msg: '必须为英文或数字字符或英文特殊字符,不得少于6位！',
  },
  /** H1:数字**/
  isNum: {
    rule: /^\d{1,}$/,
    msg: '必须为数字！',
  },
  /** H1:浮点数**/
  isFloatNum: {
    rule: /^(-?\d+)(\.\d+)?$/,
    msg: '必须为数字！',
  },
  /** H1:正整数**/
  isNumPlus: {
    rule: /^[1-9]\d*$/,
    msg: '必须为正整数！',
  },
  /** H6:中文**/
  isChinese: {
    rule: /^[\u0391-\uFFE5]+$/,
    msg: '必须为中文！',
  },
  /** H6:中文、英文、数字或下划线**/
  isChineseAndOther: {
    rule: /^[\u4e00-\u9fa5_a-zA-Z0-9()]+$/,
    msg: '只能输入中文、英文、数字或下划线！',
  },
  /** H6:电话**/
  isTel: {
    rule: /^1\d{10}$/,
    msg: '必须为手机格式',
  },
  /** H1:邮箱**/
  isEmail: {
    rule: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    msg: '必须为E-mail格式！',
  },
  /** H1:IP**/
  isIP: {
    rule: /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/,
    msg: '必须为IP格式！',
  },
  /** H1:身份证**/
  isIDCard: {
    rule: /^\d{6}(18|19|20)\d{2}(0\d|10|11|12)([0-2]\d|30|31)\d{3}[\dXx]$/,
    msg: '必须为身份证格式',
  },
  /** H6:YYYY-MM-DD hh:mm:ss**/
  isDateTimeOrNull: {
    rule: /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    msg: '必须为日期格式（年-月-日 时:分:秒）',
  },
  /** H6:hh:mm:ss**/
  isTime: {
    rule: /^(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d$/,
    msg: '必须为时间格式（时:分:秒）',
  },
  /** H6:JSON**/
  isJSON: {
    rule: /^(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d$/,
    msg: '必需为JSON格式',
  },
  /** H1:人名**/
  isName: {
    rule: /^(?:[\u4e00-\u9fa5·]{2,16})$/,
    msg: '请输入正确的姓名',
  },
  /** H6: ip */
  isIp: {
    rule: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,
    msg: '请输入有效服务器地址',
  },
  /** H6: 端口号 */
  isPort: {
    rule: /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
    msg: '请输入有效端口号',
  },
  /** 经度 */
  isLng: {
    rule: /^[-+]?(0(\.\d{1,15})?|([1-9](\d)?)(\.\d{1,15})?|1[0-7]\d{1}(\.\d{1,15})?|180\.0{1,15})$/,
    msg: '请输入有效经度',
  },
  /** 维度 */
  isLat: {
    rule: /^[-+]?((0|([1-8]\d?))(\.\d{1,15})?|90(\.0{1,15})?)$/,
    msg: '请输入有效维度',
  },
};

export function FormValidate( // 说明            （是否必填）
  type: string | RegExp, // 1、rules中的正则规则  或  2、自定义正则 \^[1|2|3]$\
  msg?: string, // 正则提示信息     （是）  【使用默认填""空字符串】
  requireMsg?: string, // 必填提示信息     （是）  【使用默认填""空字符串】
  min?: number, // 最小字符长度     （否）
  max?: number // 最大字符长度     （否）
) {
  return function (_rule: RegExp, value: any, callback: any) {
    let reg;
    // 控制是否必填
    if (value === '' || value === undefined || value === null) {
      if (!requireMsg) {
        // 如果要必填，第三个参数：requireMsg，必须要有！！！否则不会验证必填
        callback();
      }
      callback(new Error(requireMsg));
    }
    // 通过验证规则
    if (type instanceof RegExp) {
      // 使用自定义正则
      reg = type;
      if (new RegExp(reg).test(value) === true) {
        callback();
      } else {
        callback(new Error(msg || ''));
      }
    } else if (type) {
      if (rules[type]) {
        reg = rules[type].rule;
        if (value) {
          if (
            ((min || max) && value.length < (min as number)) ||
            value.length > (max as number)
          ) {
            callback(new Error(msg || rules[type].msg));
          } else if (!reg.test(value)) {
            callback(new Error(msg || rules[type].msg));
          } else {
            callback();
          }
        } else {
          callback();
        }
      } else {
        // 缺少配置的报错
        if (value === '' || value === undefined || value === null) {
          callback();
        } else {
          callback(new Error('缺少配置此验证！'));
        }
      }
    } else {
      callback();
    }
  };
}
