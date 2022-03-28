export default function HomeLayout(props) {
  const { children } = props

  return (
    <div className="bg-light-bg flex justify-start items-center min-h-screen px-20 grow shrink align-baseline">
      <div className="flex h-[32rem] relative shadow-[0_2rem_4rem_0.25rem_rgba(46,43,55,0.57)] bg-red-400">
        {children}
      </div>
    </div>
  )
}
