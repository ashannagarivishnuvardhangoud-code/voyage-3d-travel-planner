import React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function GlobeMesh() {
  const ref = React.useRef()
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * .13 })
  return <group ref={ref}>
    <mesh><sphereGeometry args={[1.14, 56, 56]} /><meshStandardMaterial color="#76aea0" roughness={.72} metalness={.05} /></mesh>
    <mesh><sphereGeometry args={[1.154, 24, 24]} /><meshBasicMaterial color="#d7eee4" wireframe transparent opacity={.13} /></mesh>
    <mesh rotation={[Math.PI / 2.7, .15, -.3]}><torusGeometry args={[1.47, .008, 8, 120]} /><meshBasicMaterial color="#f3b177" transparent opacity={.8} /></mesh>
    <mesh position={[.56, .43, .8]}><sphereGeometry args={[.055, 18, 18]} /><meshBasicMaterial color="#f7b96d" /></mesh>
    <mesh position={[-.45, -.24, 1]}><sphereGeometry args={[.04, 18, 18]} /><meshBasicMaterial color="#f7b96d" /></mesh>
  </group>
}
class GlobeBoundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}
export default function Globe() {
  return <GlobeBoundary><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.8], fov: 44 }} gl={{ alpha: true, antialias: true }}><ambientLight intensity={1.8} /><directionalLight position={[3, 2, 4]} intensity={2.6} color="#fff0d8" /><GlobeMesh /></Canvas></GlobeBoundary>
}
