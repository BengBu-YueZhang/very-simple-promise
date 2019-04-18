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
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function isArray (arr) {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

function reject (promise, reason) {
  if (promise._state !== pending) {
    return
  }

  promise._state = rejected
  promise._value = reason

  let task
  while (task = promise._tasks.shift()) {
    handlePromise(promise, task)
  }
}

function resolve (promise, result) {
  if (promise._state !== pending) {
    return
  }

  if (promise === result) {
    throw reject(promise, new TypeError('promise and x refer to the same object'))
  }

  if (isPromise(result)) {
    if (result._state === pending) {
      // 如果result是promise，并且处于pending态，promise需要保持pending态，直到result被执行和拒绝
      // 我们使用相同值履行或者拒绝promise
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
  // 需要在宏任务完后的微任务队列中执行
  setImmediate(() => {
    // // nextPromise是then返回的promise
    const { onFulfilled, onRejected, promise: nextPromise } = task
    let callback = null

    let value = prevPromise._value
    let state = prevPromise._state

    if (state === fulfilled) {
      callback = onFulfilled
    } else if (state === rejected) {
      callback = onRejected
    }

    if (!callback) {
      // 如果在promise中没有注册callback
      if (state === fulfilled) {
        resolve(nextPromise, value)
      } else if (state === rejected) {
        reject(nextPromise, value)
      }
    } else {
      try {
        const result = callback(value)
        // 对then中返回promise处理
        // 将callback返回的结果，带入到新的promise中
        resolve(nextPromise, result)
      } catch (error) {
        reject(nextPromise, error)
      }
    }
  })
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

  static resolve (result) {
    return new Promise((resolve) => { resolve(result) })
  }

  static reject (reason) {
    return new Promise((_, reject) => { reject(reason) })
  }

  static race (promises) {
    if (isArray(promises)) {
      let promisesLength = promises.length
      return new Promise((resolve, reject) => {
        for (let i = 0; i < promisesLength; i++) {
          promises[i].then((result) => {
            resolve(result)
          }).catch((error) => {
            reject(error)
          })
        }
      })
    } else {
      throw new TypeError('The arguments must be arrays')
    }
  }

  static all (promises) {
    if (isArray(promises)) {
      let promisesLength = promises.length
      let counter = 0
      let resultList = []
      return new Promise((resolve, reject) => {
        for (let i = 0; i < promisesLength; i++) {
          promises[i].then((result) => {
            counter += 1
            resultList.push(result)
            if (counter === promisesLength) {
              resolve(resultList)
            }
          }).catch((error) => {
            reject(error)
          })
        }
      })
    } else {
      throw new TypeError('The arguments must be arrays')
    }
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
      handlePromise(this, task)
    }

    // 返回新的promise
    return nextPromise
  }

  catch (onRejected) {
    let nextPromise = new Promise(function () {})

    // onFulfilled设置为null
    let task = new Task(null, onRejected, nextPromise)

    if (this._state === pending) {
      this._tasks.push(task)
    } else {
      handlePromise(this, task)
    }

    // 返回新的promise
    return nextPromise
  }

  finally (callback) {
    // this指向调用finally的对象
    const self = this
    // 向Promise链中添加then，无论，promise是resolve态还是reject态，都会执行callback
    // 并且会通过then，继续将result或reason向下传递
    return self.then(
      result => Promise.resolve(callback()).then(_ => result),
      reason => Promise.resolve(callback()).then(_ => { throw reason })
    )
  }
}

