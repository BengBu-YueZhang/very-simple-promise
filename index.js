const pending = 0
const fulfilled = 1
const rejected = 2

function isPromise (promise) {
  return promise instanceof Promise
}

function isFunction (func) {
  return Object.prototype.toString.call(func) === '[object Function]'
}

function isObject (obj) {
  return Object.prototype.toString.call(func) === '[object Object]'
}

function reject (promise, reason) {}

function resolve (promise, result) {
  if (promise === result) {
    throw reject(promise, new TypeError('promise and x refer to the same object'))
  }

  if (isPromise(result)) {
    if (result._state === pending) {
      // 如果result是promise，并且处于pending态，promise需要保持pending态，直到result被执行和拒绝
      result._tasks.concat(promise._tasks)
    } else if (result._state === fulfilled || result._state === rejected) {
      // 如果result是promise，并且处于fulfilled或rejected态，我们使用result的值拒绝或者履行它
      let task
      while (task = promise._tasks.shift()) {
        handlePromise(result, task)
      }
    }
    return
  }

  if (isObject(result)) {

    let then = null

    try {
      then = result.then
    } catch (error) {
      reject(promise, error)
    }

    if (isFunction(then)) {
      try {
        let resolvePromise = function (y) {
          resolve(promise, y)
        }
        let rejectPromise = function (r) {
          reject(promise, r)
        }
        then.call(result, resolvePromise, rejectPromise)
      } catch (error) {
        reject(promise, error)
      }

      return
    }
  }

  promise._state = fulfilled
  promise._value = result

  if (promise._tasks && promise._tasks.length) {
    let task = null
    while (task = promise._tasks.shift()) {
      handlePromise(promise, task)
    }
  }
}


function handlePromise (prevPromise, task) {
}

class Task {
  constructor (onFulfilled, onRejected, promise) {
    if (typeof onFulfilled !== 'function') {
      onFulfilled = null
    }
    if (typeof onRejected !== 'function') {
      onRejected = null
    }
    this.onFulfilled = onFulfilled
    this.onRejected = onRejected
    this.promise = promise
  }
}

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
    
    let nextPromise = new Promise(function () {})

    let task = new Task(onFulfilled, onRejected, nextPromise)

    if (this._state === pending) {
      this._tasks.push(task)
    } else {
      handlePromise(this, nextPromise)
    }

    // 返回新的promise
    return nextPromise
  }
}
