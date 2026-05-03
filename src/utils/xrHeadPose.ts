import * as THREE from 'three'

const eyePosition = new THREE.Vector3()
const xrCameraScale = new THREE.Vector3()

function getActiveCamera(camera: THREE.Camera, gl: THREE.WebGLRenderer) {
  return gl.xr.isPresenting ? gl.xr.getCamera() : camera
}

export function getHeadPose(
  camera: THREE.Camera,
  gl: THREE.WebGLRenderer,
  targetPosition: THREE.Vector3,
  targetQuaternion: THREE.Quaternion
) {
  if (gl.xr.isPresenting) {
    const xrCamera = gl.xr.getCamera()
    xrCamera.getWorldQuaternion(targetQuaternion)

    if (xrCamera instanceof THREE.ArrayCamera && xrCamera.cameras.length > 0) {
      targetPosition.set(0, 0, 0)
      for (const eyeCamera of xrCamera.cameras) {
        targetPosition.add(eyeCamera.getWorldPosition(eyePosition))
      }
      targetPosition.multiplyScalar(1 / xrCamera.cameras.length)

      return
    }

    xrCamera.matrixWorld.decompose(targetPosition, targetQuaternion, xrCameraScale)
    return
  }

  camera.getWorldPosition(targetPosition)
  camera.getWorldQuaternion(targetQuaternion)
}

export function getHeadEuler(
  camera: THREE.Camera,
  gl: THREE.WebGLRenderer,
  targetEuler: THREE.Euler
) {
  const activeCamera = getActiveCamera(camera, gl)

  targetEuler.copy(activeCamera.rotation)
  if (activeCamera instanceof THREE.ArrayCamera && activeCamera.cameras.length > 0) {
    targetEuler.copy(activeCamera.cameras[0].rotation)
  }
}
