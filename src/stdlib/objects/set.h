template<typename T>
struct Set{
    private:
    std::set<T> data;
    public:
    int size;
    Set(){
        size = 0;
    }
    //add,clear,delete,entries,forEach,has,values
    Set& add(T value){
        data.insert(value);
        size++;
        return *this;
    }
    void clear(){
        data.clear();
        size = 0;
    }
    bool delete(T value){
        int index = data.find(value);
        if (index != data.end()){
            data.erase(index);
            size--;
            return true;
        }
        return false;
    }
    void entries(){
        //for set(5,200) we should return [[5,5],[200,200]]
    }
    //returns Iterator
    void values(){
        
    }
    void keys(){
        //return values();
    }
    bool has(T value) {
        return data.find(value) != data.end();
    }
};
