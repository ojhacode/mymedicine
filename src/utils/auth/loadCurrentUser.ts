import { getLoggedInUser, getUserById } from "@db/repository/user/fetch"
import { User } from "@type/context/auth"
import { SQLiteDatabase } from "expo-sqlite"
import { Dispatch, SetStateAction } from "react"

export const emptyUser: User = {id: 0, email: "", userServerId: "",  userName: "",photoUrl: "", ownerId: 0, ownerServerId: "", ownerName:"", ownerPhotoUrl:"", isLoggedIn:0}

export const loadCurrentUser = async (
  db: SQLiteDatabase,
  setCurrentUser: Dispatch<SetStateAction<User>>,
  ownerId?: number,
  familyMode?: boolean
) => {
  // ------------------------------------------
  // Logged-in user = authenticated actor
  // ------------------------------------------
    try{
      const loggedInUser = await getLoggedInUser(db)

      if (!loggedInUser) {
        setCurrentUser(emptyUser)
        return
      }

      // ------------------------------------------
      // Normal Mode
      // ------------------------------------------

      if (!familyMode) {
        setCurrentUser(loggedInUser)
        return
      }

      // ------------------------------------------
      // Family Mode
      // ------------------------------------------

      if (!ownerId) {
        setCurrentUser(loggedInUser)
        return
      }
      console.log(ownerId)

      const ownerUser = await getUserById(db, ownerId)
      if (!ownerUser) {
        setCurrentUser(loggedInUser)
        return
      }

      // ------------------------------------------
      // Keep logged-in identity,
      // change only active owner/scope
      // ------------------------------------------

      setCurrentUser({
        ...loggedInUser,
        ownerId: ownerUser.id,
        ownerServerId: ownerUser.userServerId,
        ownerName:ownerUser.ownerName,
        ownerPhotoUrl:ownerUser.photoUrl
      })
    } catch(e){
      console.log(e)
    }
}