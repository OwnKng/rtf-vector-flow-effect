import { createNoise2D } from "simplex-noise"
import * as THREE from "three"
import { useThree, useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"

const noise = createNoise2D()

const rows = 100
const cols = 100

const COUNT = 5000
const STRENGTH = 0.001
const tempObject = new THREE.Object3D()

type Particle = {
  position: THREE.Vector2
  acceleration: THREE.Vector2
  velocity: THREE.Vector2
  maxSpeed: number
  maxForce: number
  rotation: THREE.Quaternion
  lifespan: number
  scale: number
}

const createFlowField = (
  width: number,
  height: number,
  rows: number,
  cols: number
) =>
  Array.from({ length: rows * cols }, (_, i) => {
    const cellWidth = width / cols
    const cellHeight = height / rows

    const u = ((i % cols) * cellWidth) / width
    const v = (Math.floor(i / rows) * cellHeight) / height

    const angle = noise(u, v) * Math.PI

    const x = Math.cos(angle)
    const y = Math.sin(angle)

    return new THREE.Vector2(x, y).multiplyScalar(STRENGTH)
  })

const applyForce = (particle: Particle, force: THREE.Vector2) =>
  particle.acceleration.add(force)

const updatePosition = (particle: Particle) => {
  particle.velocity.add(particle.acceleration)
  particle.velocity.clampLength(-particle.maxSpeed, particle.maxSpeed)
  particle.acceleration.multiplyScalar(0)

  particle.position.add(particle.velocity)
}

const follow = (
  particle: Particle,
  grid: any,
  width: number,
  height: number
) => {
  const x = Math.floor(particle.position.x / width)
  const y = Math.floor(particle.position.y / height)

  const index = x + y * cols
  const force = grid[index] || new THREE.Vector2(0, 0)
  force.clampLength(-particle.maxForce, particle.maxForce)

  applyForce(particle, force)
}

export default function Sketch() {
  const ref = useRef<THREE.InstancedMesh>(null!)

  const mousePos = useRef(new THREE.Vector2(0, 0))
  const prevMousePos = useRef(new THREE.Vector2(0, 0))

  const { viewport } = useThree()

  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        position: new THREE.Vector2(0, 0),
        velocity: new THREE.Vector2(0, 0),
        acceleration: new THREE.Vector2(0, 0),
        maxSpeed: 0.1,
        maxForce: 0.1,
        rotation: new THREE.Quaternion().random(),
        lifespan: THREE.MathUtils.randFloat(0, 2),
        scale: 0,
      })),
    []
  )

  const flowField = useMemo(
    () => createFlowField(viewport.width, viewport.height, rows, cols),
    [viewport]
  )

  useFrame((state, delta) => {
    mousePos.current.set(state.mouse.x, state.mouse.y)

    const mouseSpeed = mousePos.current.clone().sub(prevMousePos.current)

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i]

      if (p.lifespan < 0) {
        if (mouseSpeed.length() > 0) {
          p.position
            .set(
              (state.mouse.x * 0.5 + 0.5) * viewport.width,
              (state.mouse.y * 0.5 + 0.5) * viewport.height
            )
            .add(
              new THREE.Vector2()
                .random()
                .subScalar(0.5)
                .setLength(Math.random() * 0.5)
            )

          p.lifespan = THREE.MathUtils.randFloat(0, 1.4)
          p.scale = p.lifespan

          p.velocity.set(0, 0)
          p.acceleration.copy(mouseSpeed)
        }
      }

      follow(p, flowField, viewport.width / cols, viewport.height / rows)
      updatePosition(p)

      p.scale = THREE.MathUtils.lerp(p.scale, 0, 0.05)
      p.lifespan -= delta

      tempObject.position.set(p.position.x, p.position.y, 0)
      tempObject.scale.setScalar(p.scale)
      tempObject.setRotationFromQuaternion(p.rotation)
      tempObject.updateMatrix()

      ref.current.setMatrixAt(i, tempObject.matrix)
    }

    ref.current.instanceMatrix.needsUpdate = true
    prevMousePos.current.copy(mousePos.current)
  })

  return (
    <instancedMesh
      castShadow
      receiveShadow
      ref={ref}
      position={[-viewport.width * 0.5, -viewport.height * 0.5, 0]}
      args={[undefined, undefined, COUNT]}
    >
      <cylinderGeometry args={[0.0, 1, 1, 3, 1]} />
      <meshPhongMaterial color={0x228cdb} />
    </instancedMesh>
  )
}
