import { Canvas } from "@react-three/fiber"
import Sketch from "./Sketch"

export default function App() {
  return (
    <div className='App'>
      <Canvas
        shadows
        orthographic
        camera={{
          position: [0, 0, 5],
          zoom: 80,
        }}
      >
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 0, 15]} castShadow />
        <Sketch />
      </Canvas>
    </div>
  )
}
