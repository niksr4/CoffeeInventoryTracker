export function formatDateForDisplay(dateString?: string): string {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12

    return `${day}/${month}/${year}, ${displayHours}:${minutes} ${ampm}`
  } catch (error) {
    return dateString
  }
}

export function formatDateOnly(dateString?: string): string {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  } catch (error) {
    return dateString
  }
}

export function formatDateForQIF(dateString?: string): string {
  if (!dateString) return ""
  try {
    // Parse the date string - handle both ISO format and other formats
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    // Get the date components in local time
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    // QIF format expects M/D/YYYY (month/day/year)
    // Using template literals to ensure correct order
    return `${month}/${day}/${year}`
  } catch (error) {
    return ""
  }
}

export function formatDateForInput(dateString?: string): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    return ""
  }
}
