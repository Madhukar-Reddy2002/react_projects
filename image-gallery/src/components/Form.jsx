import {useState} from 'react'

const Form = () => {
    const [formData, setformData] = useState({
        name:"",
        email:""
      })
      const handleChange = (e)=>{
        const {name, value} = e.target;
        setformData((prevData)=>({
          ...prevData, [name]:value,
        }))
      }
      const handleSubmit = (e)=>{
        e.preventDefault();
        alert("i am "+ formData.name+ formData.email)
        setformData({
          name:"",
          email:""
        })
        
      }
      return (
        <div>
          <form onSubmit={handleSubmit}>
            <div className=' m-3'>
              <span htmlFor="">Name:</span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className=' text-slate-900'/>
            </div>
            <div>
            <span htmlFor="">Email:</span>
              <input type="text" name="email" value={formData.email} onChange={handleChange} className=' text-slate-900'/>
            </div>
            <button className=' text-center bg-blue-500 px-3 py-2 m-2 rounded-md' type="submit">Submit</button>
          </form>
        </div>
      )
}

export default Form