const { delay, MD5 } = require('../lib')
const { getConfig, sendRobotInfo, sendError, putqn, setQrCode, updatePanelVersion } = require('../proxy/aibotk')
const { addUser } = require('../common/userDb')
const { initAllSchedule } = require('../task')
const { initMqtt } = require('../proxy/mqtt')
const { allConfig } = require('../common/configDb')

/**
 * 登录成功监听事件
 * @param {*} user 登录用户
 */
async function onLogin(user) {
  try {
    console.log(`贴心助理${user}登录了`)
    await updatePanelVersion()
    await setQrCode('', 4)
    await sendError('')
    await getConfig() // 获取配置文件
    const config = await allConfig()
    const { userId } = config.userInfo
    const payload = user.payload || user._payload
    const userInfo = {
      ...payload,
      robotId: payload.weixin || MD5(user.name()),
    }
    await addUser(userInfo) // 全局存储登录用户信息
    const file = await user.avatar()
    const base = await file.toBase64()
    const avatarUrl = await putqn(base, userId)
    await sendRobotInfo(avatarUrl, user.name(), userInfo.robotId) // 更新用户头像
    await delay(3000)
    await initAllSchedule(this) // 初始化任务
    await initMqtt(this) // 初始化mqtt任务
  } catch (e) {
    console.log('登录后初始化失败', e)
  }
}

module.exports = onLogin
