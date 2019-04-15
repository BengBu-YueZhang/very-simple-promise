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
  // 如果不是PENDING状态，无效，根据PromiseA+的规范，无法再次修改Promise的状态
  if (promise._state !== PENDING) {
    return
  } else {
    if (result in Promise) {
      let newPromise = result
      if (newPromise._state === PENDING) {
        newPromise._tasks.push(...promise._tasks)
      } else {
        while (promise._tasks.length) {
          const task = promise._tasks.shift()
          handleResolved(newPromise, task)
        }
      }
    } else {
      promise._value = result
      promise._state = FULFILLED
      // 清空任务队列
      while (promise._tasks.length) {
        const task = promise._tasks.shift()
        handleResolved(promise, task)
      }
    }
  }
}

function reject (promise, reason) {
}

function handleResolved (prevPromise, task) {
  // 判断使用什么回调用
  const callback = prevPromise._state === FULFILLED ? onFulfilled : onRejected
  const { onFulfilled, onRejected, promise: nextPromise } = task

  // 在宏任务执行完之后，才会开始执行微任务
  setImmediate(() => {
    if (!callback) {
      // 如果没有回调的情况下
      if (prevPromise._state === FULFILLED) {
        resolve(nextPromise, prevPromise._value)
      } else if (prevPromise._state === REJECTED) {
        reject(nextPromise, prevPromise._value)
      }
    } else {
      try {
        // 执行回调, 将回调返回结果带入下一个task
        let result = callback(prevPromise._value)
        resolve(nextPromise, result)
      } catch (error) {
        reject(nextPromise, error)
      }
    }
  })
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

  static resolve (result) {
    return new Promise((resolve) => resolve(result))
  }

  static reject (reason) {
    return new Promise((resolve, reject) => reject(reason))
  }

  static all (arr) {
  }

  static rarc (arr) {
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

  catch () {
  }

  finally () {
  }
}

export default Promise