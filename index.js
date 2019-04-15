const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

class Task {
  constructor (onFulfilled, onRejected, promise) {
    this.onFulfilled = onFulfilled
    this.onRejected = onRejected
    this.promise = promise
  }
}

// resolve会将当前的promise状态设置为1
function resolve (promise, result) {
  if (promise._state !== PENDING) {
    return
  } else {
    promise._value = result
    promise._state = FULFILLED
    while (promise._tasks.length) {
      const task = promise._tasks.shift()
      handleResolved(promise, task)
    }
  }
}

function reject (promise, reason) {
}

function handleResolved (prevPromise, task) {
  const { onFulfilled, onRejected, promise: nextPromise } = task
  const callback = prevPromise._state === FULFILLED ? onFulfilled : onRejected

  if (!callback) {

  } else {
    
  }
}

/**
 * 每次创建Promise对象时, 会立刻执行Promise中的fn
 */
class Promise {
  constructor (fn) {
    // Promise的状态
    this._state = PENDING
    // Promised的值
    this._value = null
    // then的队列
    this._tasks = []

    const promise = this

    // 立即执行fn
    try {
      fn(
        result => resolve(promise, result),
        reason => reject(promise, reason)
      )
    } catch (error) {
      reject(promise, error) 
    }
  }

  // then会返回一个新的promise，可以形成链式调用
  then (onFulfilled, onRejected) {

    const newPromise = new Promise(function () {})
    const task = new Task(onFulfilled, onRejected, newPromise)

    // 如果状态为PENDING, 将任务push到队列中
    if (this._state === PENDING) {
      this._tasks.push(task) 
    } else {
      // 如果为FULFILLED或者REJECTED, 则立即执行回调
      handleResolved(this, task)
    }

    return newPromise
  }
}

export default Promise