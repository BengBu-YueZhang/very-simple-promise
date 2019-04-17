const pending = 0
const fulfilled = 1
const rejected = 2

function reject (promise, result) {}

function resolve (promise, reason) {}

function handlePromise () {}

export default class Promise {
  constructor (fn) {
    this.fn = fn
    // Promise的状态, 初始状态为pending
    this._state = pending
    // Promise的fulfilled态的原因，或者Promise的rejected态的理由
    this._value = null
    // 存储then的队列
    this._tasks = []
    // 创建Promise对象后，立即执行fn
    this.init()
  }

  init () {
    try {
      // 执行fn, 传入包装后的resolve，reject
      // reject，resolve会修改promise的状态
      this.fn(
        (result) => resolve(this, result),
        (reason) => reject(this, reason)
      )
    } catch (error) {
      reject(this)
    }
  }

  then (onFulfilled, onRejected) {
    
    if (this._state === pending) {

    } else {

    }
  }
}
