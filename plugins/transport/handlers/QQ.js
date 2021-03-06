'use strict';

const truncate = (str, maxLen = 10) => {
    str = str.replace(/\n/gu, '');
    if (str.length > maxLen) {
        str = str.substring(0, maxLen - 3) + '...';
    }
    return str;
};

let bannedMessage = new Map();

module.exports = (variables, config) => {
    const {bridge, Request, Broadcast, pluginManager, handler: qqHandler} = variables;
    const options = config.options.QQ || {};

    if (!options.notify) {
        options.notify = {};
    }

    /*
     * 傳話
     */
    // 將訊息加工好並發送給其他群組
    qqHandler.on('text', (context) => {
        const send = () => bridge.send(context).catch(() => {});

        // 「應用消息」
        if (context.from === 1000000 && options.notify.sysmessage) {
            bridge.send(new Broadcast(context));
            return;
        }

        // 過濾口令紅包
        if (context.extra.isCash) {
            let key = `${context.to}: ${context.text}`;
            if (!bannedMessage.get(key)) {
                bannedMessage.set(key, setTimeout(() => {
                    bannedMessage.delete(key);
                }, 300000));
                bridge.send(new Broadcast(context, {
                    text: `已暫時屏蔽「${context.text}」`
                }));
            }
            return;
        }

        if (!context.isPrivate && context.extra.ats && context.extra.ats.length > 0) {
            // 先處理QQ的@
            let promises = [];

            for (let at of context.extra.ats) {
                promises.push(qqHandler.groupMemberInfo(context.to, at));
            }

            Promise.all(promises).then((infos) => {
                for (let info of infos) {
                    context.text = context.text.replace(new RegExp(`@${info.qq}`, 'g'), `＠${qqHandler.getNick(info)}`);
                }
                send();
            }).catch(() => {
                send();
            });
        } else {
            send();
        }
    });

    // 收到了來自其他群組的訊息
    qqHandler.on('exchange', (context, resolve, reject) => {
        let to;
        if (context.extra.mapto) {
            to = context.extra.mapto[qqHandler.type];
        }

        switch (context.type) {
            case 'message':
                if (context.extra.isAction) {
                    // 一定是 IRC
                    qqHandler.say(to, `* ${context.nick} ${context.text}`);
                    resolve();
                } else {
                    let special = '';
                    let prefix = '';
                    if (!config.options.hidenick) {
                        if (context.extra.reply) {
                            const reply = context.extra.reply;
                            special = `Re ${reply.nick} `;

                            if (reply.isText) {
                                special += `「${truncate(reply.message)}」`;
                            } else {
                                special += reply.message;
                            }

                            special += ': ';
                        } else if (context.extra.forward) {
                            special = `Fwd ${context.extra.forward.nick}: `;
                        }

                        if (context.extra.clients >= 3) {
                            prefix = `[${context.handler.id} - ${context.nick}] ${special}`;
                        } else {
                            prefix = `[${context.nick}] ${special}`;
                        }
                    }

                    // 檔案
                    const attachFileUrls = () => (context.extra.uploads || []).map(u => ` ${u.url}`).join('');
                    const send = (output, noEscape = false) => {
                        qqHandler.say(to, output, {
                            noEscape: noEscape,
                        });
                        resolve();
                    };

                    // 與file-cqpro.js整合
                    if (context.extra.uploads && context.extra.isImage && pluginManager.plugins['file-cqpro']) {
                        pluginManager.plugins['file-cqpro']
                            .process(context)
                            .then(codes => {
                                let output = qqHandler.escape(prefix);
                                output += '\n' + codes.join('\n');

                                if (context.extra.imageCaption) {
                                    output += '\n' + qqHandler.escape(context.extra.imageCaption);
                                }
                                send(output, true);
                            }).catch(e => {
                                send(prefix + context.text + attachFileUrls());
                            });
                    } else {
                        send(prefix + context.text + attachFileUrls());
                    }
                }
                break;

            case 'request':
                qqHandler.emit('request', context);
                if (context.command) {
                    qqHandler.emit(`request#${context.command}`, context);
                }
                resolve();
                break;

            case 'broadcast':
                if (context.extra.clients >= 3) {
                    qqHandler.say(to, `< ${context.handler.type}: ${context.text} >`);
                } else {
                    qqHandler.say(to, `< ${context.text} >`);
                }
                resolve();
                break;

            default:
                reject();
        }
    });


    /*
     * 加入與離開
     */
    qqHandler.on('join', (data) => {
        if (options.notify.join) {
            bridge.send(new Broadcast({
                from: data.group,
                to: data.group,
                nick: data.user_target.name,
                text: `${data.user_target.name} (${data.target}) 加入QQ群`,
                handler: qqHandler,
                _rawdata: data,
            })).catch(() => {});
        }
    });

    qqHandler.on('leave', (data) => {
        let text;
        if (data.type === 1) {
            text = `${data.user_target.name} (${data.target}) 退出QQ群`;
        } else {
            text = `${data.user_target.name} (${data.target}) 被管理員踢出QQ群`;
        }

        if (options.notify.leave) {
            bridge.send(new Broadcast({
                from: data.group,
                to: data.group,
                nick: data.user_target.name,
                text: text,
                handler: qqHandler,
                _rawdata: data,
            })).catch(() => {});
        }
    });

    /*
     * 管理員
     */
    qqHandler.on('admin', (data) => {
        let text;
        if (data.type === 1) {
            text = `${data.user.name} (${data.target}) 被取消管理員`;
        } else {
            text = `${data.user.name} (${data.target}) 成為管理員`;
        }

        if (options.notify.setadmin) {
            bridge.send(new Broadcast({
                from: data.group,
                to: data.group,
                nick: data.user.name,
                text: text,
                handler: qqHandler,
                _rawdata: data,
            })).catch(() => {});
        }
    });

    /*
     * 查詢IRC群組情況的命令
     */
    const sendRequest = (context) => {
        let ctx = new Request(context);
        ctx.targets = 'IRC';

        bridge.send(ctx).catch(() => {});
    };

    qqHandler.addCommand('/ircnames', sendRequest);
    qqHandler.addCommand('/ircwhois', sendRequest);
    qqHandler.addCommand('/irctopic', sendRequest);
    qqHandler.addCommand('/irccommand', sendRequest);
};
