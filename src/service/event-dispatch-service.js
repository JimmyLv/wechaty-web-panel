const api = require('../proxy/api')
const { getConfig, getRoomPhotoConfig, getMeiNv } = require('../proxy/aibotk')
const { getConstellation, msgArr, getAllSchedule, getRoomAvatar } = require('../lib')
const { generateAvatar, generateRoomImg } = require('../puppeteer-paint/lanuch')
const { initTaskLocalSchedule } = require('../task/index')
const { updateContactAndRoom, updateContactOnly, updateRoomOnly } = require('../common/index')
const { chatTencent } = require('../proxy/tencent')
/**
 * 根据事件名称分配不同的api处理，并获取返回内容
 * @param {string} eName 事件名称
 * @param {string} msg 消息内容
 * @param name
 * @param id
 * @param avatar
 * @returns {string} 内容
 */
async function dispatchEventContent(that, eName, msg, name, id, avatar, room) {
  try {
    let content = '',
      type = 1,
      url = ''
    switch (eName) {
      case 'rubbish':
        content = await api.getRubbishType(msg)
        break
      case 'mingyan':
        content = await api.getMingYan()
        break
      case 'star':
        let xing = getConstellation(msg)
        content = await api.getStar(xing)
        break
      case 'xing':
        content = await api.getXing(msg)
        break
      case 'skl':
        content = await api.getSkl(msg)
        break
      case 'lunar':
        content = await api.getLunar(msg)
        break
      case 'goldreply':
        content = await api.getGoldReply(msg)
        break
      case 'xhy':
        content = await api.getXhy(msg)
        break
      case 'rkl':
        content = await api.getRkl(msg)
        break
      case 'avatar':
        if (avatar.mimeType) {
          // 如果图片类型正确再进行头像处理
          let base64Text = await avatar.toDataURL()
          url = await generateAvatar({ avatar: base64Text })
          type = 3
        } else {
          content = '你的头像属于高维世界产物，小助手能力不足，无法解析，待我修炼后为你提供服务'
        }
        break
      case 'emo':
        url = await api.getEmo(msg)
        type = 2
        break
      case 'meinv':
        url = await getMeiNv()
        type = 2
        break
      case 'ncov':
        content = await api.getNcov()
        break
      case 'cname':
        content = await api.getCname()
        break
      case 'roomAvatar':
        let memberList = []
        const roomName = await room.topic() // 获取群名
        const config = await getRoomPhotoConfig(roomName)
        if (!config.authList) {
          content = '本群暂未开通群合影功能，请联系群主或管理员开启'
        } else if (config.authList.length) {
          if (config.authList.includes(name)) {
            memberList = await getRoomAvatar(room, roomName, name)
            const baseImg = await generateRoomImg({ list: memberList, options: config })
            type = 3
            url = baseImg
          } else {
            content = '很抱歉，你没有生成群合影的权限，请联系管理员或群主开通'
          }
        } else {
          memberList = await getRoomAvatar(room, roomName, name)
          const baseImg = await generateRoomImg({ list: memberList, options: config })
          type = 3
          url = baseImg
        }
        break
      case 'reloadFriendOnly':
        await updateContactOnly(that)
        content = '更新好友列表成功，请稍等两分钟后生效'
        break
      case 'reloadRoomOnly':
        await updateRoomOnly(that)
        content = '更新群列表成功，请稍等两分钟后生效'
        break
      case 'reloadFriend':
        await updateContactAndRoom(that)
        content = '更新好友群消息成功，请稍等两分钟后生效'
        break
      case 'updateConfig':
        await getConfig()
        await initTaskLocalSchedule(that)
        getAllSchedule()
        content = '更新配置成功，请稍等一分钟后生效'
        break
      default:
        break
    }
    return msgArr(type, content, url)
  } catch (e) {
    console.log('事件处理异常', e)
    return []
  }
}

/**
 * 派发不同的机器人处理回复内容
 * @param {*} bot 机器人类别 0 天行机器人 1 天行的图灵机器人 2 图灵机器人 3 腾讯闲聊机器人
 * @param {*} msg 消息内容
 * @param {*} name 发消息人
 * @param {*} id 发消息人id
 */
async function dispatchAiBot(bot, msg, name, id) {
  try {
    let res
    switch (bot) {
      case 0:
        res = await api.getResByTX(msg, id)
        break
      case 1:
        res = await api.getResByTXTL(msg, id)
        break
      case 2:
        res = await api.getResByTL(msg, id)
        break
      case 3:
        res = await chatTencent(msg, id)
        break
      default:
        res = ''
        break
    }
    return res
  } catch (e) {
    console.log('机器人接口信息获取失败', e)
    return ''
  }
}

module.exports = {
  dispatchEventContent,
  dispatchAiBot,
}
